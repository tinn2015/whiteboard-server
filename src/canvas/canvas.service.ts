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
import { Canvas } from '../entities/canvas.entity';
import { FabricObject } from '../entities/fabricObject.entity';
import { storepaths, genObject, restorePath } from './drawUtils';
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
    @InjectRepository(Canvas) private canvasRepository: Repository<Canvas>,
    @InjectRepository(FabricObject)
    private fabricObjectRepository: Repository<FabricObject>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => EventGateway))
    private readonly socketEventGateway: EventGateway,
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

    // group activeSelection
    // group deselect

    let canvas = null;
    try {
      const { pid } = qn;
      canvas = await this.canvasRepository.findOne({ id: pid });
    } catch (error) {
      this.logger.error('db error canvasRepository.findOne', { roomId, error });
    }
    const { objectIds } = canvas;
    console.log('draw canvas', canvas);
    if (objectIds.includes(qn.oid)) {
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
      objectIds.push(qn.oid);
      const queryRunner = getConnection().createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        // const canvas = await this.canvasRepository.findOne({
        //   id: qn.pid,
        //   roomId,
        // });
        console.log('不存在的画笔', canvas);
        const object = this.fabricObjectRepository.create({
          id: qn.oid,
          pageId: +qn.pid,
          object: _object,
          canvas: {
            id: +qn.pid,
          },
        });
        // canvas.objects.push(object);
        await queryRunner.manager.save(object);
        await queryRunner.manager.save(canvas);

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
      case CONTANTS.CMD_BGCOLOR:
        this._setBackgroundColor(roomId, data);
        break;
      case CONTANTS.CMD_BGIMG:
        this._setBackgroundImage(roomId, data);
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
      // console.log('fabricObjects', fabricObjects);
      fabricObjects.forEach((i) => {
        const _props = mos[i.id];
        console.log('_props', _props, Object.keys(_props));
        Object.keys(_props).forEach((key: string) => {
          console.log(key, i.object);
          i.object[key] = _props[key];
        });
      });
      console.log('fabricObjects2', fabricObjects);
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
    const { objects, cProps } = canvas;
    const objs = [];
    Object.keys(objects).forEach((key: string) => {
      const obj = objects[key];
      console.log('历史画布数据', obj);
      objs.push(obj.object);
    });
    return {
      version: '5.2.0',
      background: cProps.background,
      backgroundImage: cProps.backgroundImage,
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
    let canvas = null;
    try {
      canvas = await this.canvasRepository.findOne({ id: data.pid });
      if (!canvas.objectIds.length) {
        this.logger.warn(`roomId: ${roomId} 的 canvas 中没有 objectIds`);
        return;
      }
      const fabricObjects = await this.fabricObjectRepository.findByIds(
        canvas.objectIds,
      );

      // todo 事务
      await this.fabricObjectRepository.remove(fabricObjects);
      canvas.objectIds = [];
      await this.canvasRepository.save(canvas);
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
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const canvas = await this.canvasRepository.findOne({ id: data.pid });
      const index = canvas.objectIds.findIndex((i: string) => {
        return i === oid;
      });
      if (index > -1) {
        canvas.objectIds.splice(index, 1);
      }
      const object = await this.fabricObjectRepository.findOne({
        id: oid,
      });
      // 保存path, undo/redo
      if (object.object.qn.t === 'path') {
        restorePath(oid, object.object.path);
      }
      await queryRunner.manager.save(canvas);
      await queryRunner.manager.remove(object);

      await queryRunner.commitTransaction();
      this.logger.log('info', `删除画笔 ${oid}`, data);
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      this.logger.error(`room: ${roomId} 删除画笔失败`, err, data);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
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
   * 修改背景色
   * @param roomId
   * @param data
   */
  async _setBackgroundColor(roomId: string, data) {
    try {
      const canvasEntity = await this.canvasRepository.findOne({
        id: data.pid,
      });
      canvasEntity.cProps.background = data.color;
      this.canvasRepository.save(canvasEntity);
      this.logger.log('info', `room: ${roomId} 背景修改成功`, data);
    } catch (err) {
      this.logger.error(`room: ${roomId} 修改背景色失败`, data);
    }
  }

  /**
   * 修改背景图片
   * @param roomId
   * @param data
   */
  async _setBackgroundImage(roomId: string, data) {
    try {
      const canvasEntity = await this.canvasRepository.findOne({
        id: data.pid,
      });
      canvasEntity.cProps.backgroundImage = data.url;
      if (data.color) {
        canvasEntity.cProps.background = data.color;
      }
      this.canvasRepository.save(canvasEntity);
      this.logger.log('info', `room: ${roomId} 背景图片修改成功`, data);
    } catch (err) {
      this.logger.error(`room: ${roomId} 修改背景图片失败`, data);
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
    const { roomId, pageId } = deleteCanvasDto;
    const canvas = await this.canvasRepository.findOne({
      id: +pageId,
    });
    const fabricObjects = await this.fabricObjectRepository.findByIds(
      canvas.objectIds,
    );
    await this.fabricObjectRepository.remove(fabricObjects);
    await this.canvasRepository.remove(canvas);
    this.logger.log(
      'info',
      `delete canvas pageId: ${pageId} success, roomId:${roomId}`,
    );
    return {
      message: 'delete success',
    };
  }

  async batchDeleteCanvas(ids: number[], roomId: string) {
    const canvas = await this.canvasRepository.findByIds(ids);
    if (canvas) {
      canvas.forEach((canvasPage) => {
        canvasPage.objectIds.forEach(async (objectId: string) => {
          const fabricObject = await this.fabricObjectRepository.findOne({
            id: objectId,
          });
          await this.fabricObjectRepository.remove(fabricObject);
        });
      });
    }
    await this.canvasRepository.remove(canvas);
    this.logger.log(
      'info',
      `batch delete canvas ids: ${ids} success, room: ${roomId}`,
    );
  }
}
