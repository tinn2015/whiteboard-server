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
import { Room } from '../entities/room.entity';
import { Canvas } from '../entities/canvas.entity';
import { FabricObject } from '../entities/fabricObject.entity';
import {
  storepaths,
  genObject,
  restorePath,
  removeStorePath,
} from './drawUtils';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ModifiedObjects } from '../typing';
import { CreateCanvasDto } from './dto/create-canvas.dto';
import { DeleteCanvasDto } from './dto/delete-canvas.dto';
import * as CONTANTS from '../common/constants';
import { threadId } from 'worker_threads';

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
  ) {
    // this.staticCanvas = new fabric.StaticCanvas(null, {
    //   width: 2000,
    //   height: 2000,
    // });
    // console.log('this.staticCanvas', this.staticCanvas);
    // this.logger.log('info', 'this.staticCanvas init', { name: 'aaa' });
    // console.warn(`app start listen on 3000`);
  }

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

    // 缓存path
    if (qn.t === CONTANTS.DRAW_FREE_PATHS) {
      storepaths(data);
      return;
    }

    let fabricObj = null;
    try {
      const { pid, oid } = qn;
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
        console.log('fabricObj', fabricObj);
        await this.fabricObjectRepository.save(fabricObj);
        this.logger.log('info', `更新已有画笔 ${qn.oid}`);
      } else {
        // 新建fabric对象
        const _object = genObject(data);
        await this.fabricObjectRepository.save({
          id: qn.oid,
          pageId: qn.pid,
          object: _object,
        });
        this.logger.log('info', `替换已有画笔 ${qn.oid}`, _object);
      }
    } else {
      const _object = genObject(data);
      const queryRunner = getConnection().createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const object = this.fabricObjectRepository.create({
          id: qn.oid,
          pageId: +qn.pid,
          object: _object,
          canvas: {
            id: +qn.pid,
          },
        });
        await queryRunner.manager.save(object);
        await queryRunner.commitTransaction();
        this.logger.log('info', `新建画笔 ${qn.oid}`, _object);
      } catch (err) {
        // since we have errors lets rollback the changes we made
        await queryRunner.rollbackTransaction();
        this.logger.error('db error fabricObjectRepository.save', {
          pageId: +qn.pid,
          roomId,
          data,
          error: err,
        });
      } finally {
        // you need to release a queryRunner which was manually instantiated
        await queryRunner.release();
      }
    }
  }

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
    console.log('modifiedObjects', objectIds);
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
    const { objects } = canvas;
    const objs = [];
    Object.keys(objects).forEach((key: string) => {
      const obj = objects[key];
      objs.push(obj.object);
    });
    return {
      version: '5.2.0',
      background: 'transparent',
      objects: objs,
    };
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
      console.log('====fabricobjects====', fabricObjects);
      fabricObjects.forEach((fabricObj: any) => {
        if (fabricObj.object.qn.t === 'path') {
          restorePath(
            fabricObj.id,
            fabricObj.object.path.map((i) => {
              return { path: i };
            }),
          );
        }
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
    const { oid } = data.qn;
    // const queryRunner = getConnection().createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();
    try {
      const object = await this.fabricObjectRepository.findOne({
        // id: 'asa121212',
        id: oid,
      });
      if (!object) {
        this.logger.log('info', `不存在得画笔oid:${oid}`, object);
        return;
      }
      // 保存path, undo/redo
      if (object && object.object.qn.t === 'path') {
        restorePath(
          oid,
          object.object.path.map((i) => {
            return { path: i };
          }),
        );
      }
      await this.fabricObjectRepository.remove(object);

      this.logger.log('info', `删除画笔 ${oid}`, data);
      // await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      // await queryRunner.rollbackTransaction();
      this.logger.error(`room: ${roomId} 删除画笔失败`, err, data);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      // await queryRunner.release();
    }
    // try {
    //   const objEntity = await this.fabricObjectRepository.findOne({ id: oid });
    //   await this.fabricObjectRepository.remove(objEntity);
    //   this.logger.log('info', `room: ${roomId} 删除画笔成功`, data);
    // } catch (err) {
    //   this.logger.error(`room: ${roomId} 删除画笔失败`, data);
    // }
  }

  /**
   * 删除store中的path
   * @param roomId
   * @param data
   */
  async _cmdRemoveStorePath(roomId: string, data) {
    const { oids } = data;
    removeStorePath(oids);
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
