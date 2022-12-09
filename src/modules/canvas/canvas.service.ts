import {
  Injectable,
  Logger,
  Inject,
  LoggerService,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getConnection } from 'typeorm';
import { EventGateway } from '../sokcet/events.gateway';
import { RoomsService } from '../rooms/rooms.service';
import { PathService } from '../path/path.service';
import { Room } from '../../entities/room.entity';
import { Canvas } from '../../entities/canvas.entity';
import { FabricObject } from '../../entities/fabricObject.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ModifiedObjects } from '../../typing';
import { CreateCanvasDto } from './dto/create-canvas.dto';
import { DeleteCanvasDto } from './dto/delete-canvas.dto';
import * as CONTANTS from '../../common/constants';

const actionMapProps = {
  drag: ['left', 'top'],
  scale: ['scaleX', 'scaleY'],
  scaleX: ['scaleX'],
  scaleY: ['scaleY'],
  rotate: ['angle'],
};

@Injectable()
export class CanvasService {
  private staticCanvas: any;
  private canvasWidth = 1000;
  constructor(
    @InjectRepository(Room) private roomRepository: Repository<Room>,
    @InjectRepository(Canvas) private canvasRepository: Repository<Canvas>,
    @InjectRepository(FabricObject)
    private fabricObjectRepository: Repository<FabricObject>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => EventGateway))
    private readonly socketEventGateway: EventGateway,
    @Inject(forwardRef(() => RoomsService))
    private readonly roomsService: RoomsService,
    private readonly pathService: PathService,
  ) {}

  /**
   * 对canvasJson 进行增加、修改
   * @param roomId
   * @param data
   */
  async draw(roomId: string, data: any) {
    const { qn } = data;

    if (
      !qn.t ||
      qn.t === CONTANTS.DRAW_ACTIVE_SELECTION ||
      qn.t === CONTANTS.DRAW_DESELECTION ||
      qn.t === CONTANTS.DRAW_GROUP
    )
      return;

    this.logger.log('info', '普通画笔数据', data);

    // 保存path轨迹
    if (qn.t === CONTANTS.DRAW_FREE_PATHS) {
      const { qn, path, index } = data;
      const pathobj = {
        index,
        pageId: qn.pid,
        pathId: qn.oid,
        pathPoint: path,
      };
      this.pathService.addPath(pathobj);
      return;
    }

    let fabricObj = null;
    try {
      const { oid } = qn;
      fabricObj = await this.fabricObjectRepository.findOne({
        id: oid,
      });
    } catch (error) {
      this.logger.error('db error fabricObjectRepository.findOne', {
        roomId,
        error,
      });
    }
    if (fabricObj) {
      // 已有object 进行修改
      if (data.at) {
        const { oid } = qn;
        const fabricObj = await this.fabricObjectRepository.findOne({
          id: oid,
        });
        const props = actionMapProps[data.at];
        props.forEach((key: string) => {
          fabricObj.object[key] = data[key];
        });
        await this.fabricObjectRepository.save(fabricObj);
        this.logger.log('info', `pageId: ${qn.pid}, 更新已有画笔 ${qn.oid}`);
      } else {
        this.logger.error(`pageId: ${qn.pid}, qn对象缺少action`, {
          pageId: +qn.pid,
          roomId,
          data,
        });
      }
    } else {
      this.fabricObjectRepository
        .save({
          id: qn.oid,
          pageId: +qn.pid,
          object: data,
          type: qn.t,
          canvas: {
            id: +qn.pid,
          },
        })
        .then(() => {
          this.logger.log('info', `新建画笔 ${qn.oid}`, data);
        })
        .catch((err) => {
          this.logger.error('db error fabricObjectRepository.save', {
            pageId: +qn.pid,
            roomId,
            data,
            error: err,
          });
        });
    }
  }

  /**
   * cmd消息处理
   * @param roomId
   * @param data
   */
  async cmdHandle(roomId: string, data: any) {
    const { cmd } = data;
    this.logger.log('info', `收到cmd消息`, data);
    switch (cmd) {
      case CONTANTS.CMD_CLEAR:
        this._cmdClear(roomId, data);
        break;
      case CONTANTS.CMD_REMOVE:
        this._cmdRemove(roomId, data);
        break;
      case CONTANTS.CMD_RS:
        this._cmdRemoveStorePath(roomId, data);
        break;
      case CONTANTS.CMD_BG:
        this._setBackground(roomId, data);
        break;
      case CONTANTS.CMD_GRID:
        this._setGrid(roomId, data);
        break;
      case CONTANTS.PRE_PAGE:
        this._setCurrentPage(roomId, data);
        break;
      case CONTANTS.NEXT_PAGE:
        this._setCurrentPage(roomId, data);
        break;
      case CONTANTS.CHANGE_PAGE:
        this._setCurrentPage(roomId, data);
        break;
      default:
        this.logger.error('未匹配得cmd', data);
    }
  }

  // 批量修改保存到数据库
  async modifiedObjects(roomId: string, data: ModifiedObjects) {
    this.logger.log('info', `room: ${roomId} 批量修改 objects`, data);
    const { at, mos } = data;
    const objectIds = Object.keys(mos);
    try {
      const fabricObjects = await this.fabricObjectRepository.findByIds(
        objectIds,
      );
      this.logger.log(
        'info',
        `room: ${roomId} 修改前的对象 fabricObjects`,
        fabricObjects,
      );
      fabricObjects.forEach((fabricObj) => {
        const modifiedItem = mos[fabricObj.id];
        const modifiedKeys = Object.keys(modifiedItem);
        if (modifiedKeys.length) {
          modifiedKeys.forEach((key) => {
            fabricObj.object[key] = modifiedItem[key];
          });
        }
      });
      this.logger.log(
        'info',
        `room: ${roomId} 修改后的对象 fabricObjects`,
        fabricObjects,
      );
      await this.fabricObjectRepository.save(fabricObjects);
    } catch (error) {
      this.logger.error(`room: ${roomId} 批量更新object失败`, { data, error });
    }
  }

  // 历史画布数据
  async getFabricData(roomId: string, pageId: number) {
    const canvas = await this.canvasRepository.findOne(
      { id: pageId },
      { relations: ['objects'] },
    );
    // 没有数据
    if (!canvas) {
      this.logger.log('error', `不存在画布 roomId:${roomId} pageId: ${pageId}`);
      return {
        status: 0,
        message: '不存在的画布',
      };
    }
    this.logger.log('info', `获取历史画布 roomId:${roomId} pageId: ${pageId}`);
    console.log('canvas', canvas);
    const { objects } = canvas;
    const objs = [];
    const objKeys = Object.keys(objects);
    for (let i = 0; i < objKeys.length; i++) {
      const item = objects[objKeys[i]];
      if (item.type === 'path') {
        const pathObj = await this.pathService.getPath({
          pathId: item.id,
          pageId,
        });
        if (pathObj) {
          item.object.paths = pathObj.pathPoints;
        }
      }
      objs.push(item.object);
    }
    // Object.keys(objects).forEach((key: string) => {
    //   const obj = objects[key];
    //   objs.push(obj.object);
    // });
    return {
      version: '5.2.0',
      background: 'transparent',
      objects: objs,
    };
  }

  async getCanvasByIds(pageIds: number[]) {
    const canvas = await this.canvasRepository.findByIds(pageIds, {
      relations: ['objects'],
    });
    for (let i = 0; i < canvas.length; i++) {
      const { objects } = canvas[i];
      for (let j = 0; j < objects.length; j++) {
        const obj = JSON.parse(JSON.stringify(objects[j]));
        if (obj.type === 'path') {
          const paths = await this.pathService.getPath({
            pathId: obj.id,
            pageId: obj.pageId,
          });
          if (paths) {
            obj.object.paths = paths.pathPoints;
          }
        }
        objects[j] = obj;
      }
    }
    return canvas;
  }

  /**
   * cmd clear 清除画布
   * @param roomId
   * @param data
   * @returns
   */
  async _cmdClear(roomId: string, data) {
    try {
      const fabricObjects = await this.fabricObjectRepository.find({
        pageId: data.pid,
      });
      this.logger.log(
        'info',
        `roomId: ${roomId} remove, objects: ${fabricObjects.map(
          (i) => i.object.qn.oid,
        )}`,
      );
      await this.fabricObjectRepository.remove(fabricObjects);
      this.logger.log('info', `清除画布成功， userId: ${data.uid}`);
    } catch (error) {
      this.logger.error('db error, cmd clear', { roomId, error });
    }
  }

  /**
   * cmd remove 删除对象
   * @param roomId
   * @param data
   */
  async _cmdRemove(roomId: string, data) {
    console.log(roomId, data);
    const { pid, oid } = data.qn;
    try {
      const object = await this.fabricObjectRepository.findOne({
        id: oid,
      });
      if (!object) {
        this.logger.log(
          'info',
          `不存在的画笔 pageId: ${pid}, oid:${oid}`,
          object,
        );
        return;
      }
      await this.fabricObjectRepository.remove(object);

      this.logger.log('info', `删除画笔 ${oid}`, data);
    } catch (err) {
      this.logger.error(`room: ${roomId} 删除画笔失败`, err, data);
    } finally {
    }
  }

  /**
   * 删除store中的path
   * @param roomId
   * @param data
   */
  async _cmdRemoveStorePath(roomId: string, data) {
    const { oids } = data;
    // 删除轨迹
    this.pathService.removePath(oids);
  }

  /**
   * 修改背景色
   * @param roomId
   * @param data
   */
  async _setBackground(roomId: string, data) {
    try {
      const roomEntity = await this.roomRepository.findOne({
        id: roomId,
      });
      roomEntity.background = data.bg;
      this.roomRepository.save(roomEntity);
      this.logger.log('info', `room: ${roomId} 背景修改成功`, data);
    } catch (err) {
      this.logger.error(`room: ${roomId} 修改背景失败`, data);
    }
  }

  /**
   * 设置是否添加网格
   * @param roomId
   * @param data
   */
  async _setGrid(roomId: string, data) {
    try {
      const roomEntity = await this.roomRepository.findOne({
        id: roomId,
      });
      roomEntity.isGrid = data.isGrid;
      this.roomRepository.save(roomEntity);
      this.logger.log('info', `room: ${roomId} 网格修改成功`, data);
    } catch (err) {
      this.logger.error(`room: ${roomId} 修改网格失败`, data);
    }
  }

  /**
   * 创建画布
   * @param createCanvasDto
   */
  async createCanvas(createCanvas: CreateCanvasDto) {
    console.log('createCanvas', createCanvas);
    const { roomId, userId } = createCanvas;
    const canvas = await this.canvasRepository.save({
      roomId,
      room: {
        id: roomId,
      },
    });
    // 新建页面后，current为当前创建页
    this.roomsService.updateCurrentPage({ roomId, pageId: canvas.id });
    // 新建画布，广播到room中成员
    this.socketEventGateway.newWhiteboard(roomId, canvas.id, userId);
    return {
      pageId: canvas.id,
      roomId,
    };
  }

  /**
   * 删除画布
   * @param deleteCanvasDto
   * @returns
   */
  async deleteCanvas(deleteCanvasDto: DeleteCanvasDto) {
    const { roomId, pageId, userId } = deleteCanvasDto;
    const canvas = await this.canvasRepository.findOne({
      id: +pageId,
    });
    const fabricObjects = await this.fabricObjectRepository.find({
      pageId: +pageId,
    });
    if (canvas) {
      await this.pathService.removePathsByPageId(+pageId);
      await this.fabricObjectRepository.remove(fabricObjects);
      await this.canvasRepository.remove(canvas);
      // 新建画布，广播到room中成员
      this.socketEventGateway.removeWhiteboard(roomId, pageId, userId);
      this.logger.log(
        'info',
        `delete canvas pageId: ${pageId} success, roomId:${roomId}`,
      );
      return {
        message: 'delete success',
      };
    } else {
      this.logger.log(
        'error',
        `can't find canvas pageId: ${pageId}, roomId:${roomId}`,
      );
    }
  }

  async batchDeleteCanvas(ids: number[], roomId: string) {
    const canvas = await this.canvasRepository.findByIds(ids);
    if (canvas) {
      canvas.forEach(async (canvasPage) => {
        const fabricObjects = await this.fabricObjectRepository.find({
          pageId: canvasPage.id,
        });
        await this.fabricObjectRepository.remove(fabricObjects);
      });
    }
    await this.canvasRepository.remove(canvas);
    this.logger.log(
      'info',
      `batch delete canvas ids: ${ids} success, room: ${roomId}`,
    );
  }

  async _setCurrentPage(roomId: string, data) {
    this.roomsService.updateCurrentPage({ roomId, pageId: data.pid });
  }

  async _setDeletePage(roomId: string, data) {
    this.deleteCanvas({ roomId, pageId: data.pid, userId: data.userId });
  }
}