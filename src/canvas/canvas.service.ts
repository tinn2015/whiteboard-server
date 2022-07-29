import { Injectable, Logger, Inject, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Canvas } from '../entities/canvas.entity';
import { FabricObject } from '../entities/fabricObject.entity';
import { storepaths, genObject } from './drawUtils';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ModifiedObjects } from '../typing';

@Injectable()
export class CanvasService {
  private staticCanvas: any;
  private canvasWidth = 1000;
  constructor(
    @InjectRepository(Canvas) private canvasRepository: Repository<Canvas>,
    @InjectRepository(FabricObject)
    private fabricObjectRepository: Repository<FabricObject>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
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
    this.logger.log('info', '普通画笔数据', data);
    const { qn } = data;

    if (!qn.t || qn.t === 'as' || qn.t === 'ds' || qn.t === 'group') return;

    this.logger.log('info', `draw ${qn.t}`, qn);

    // 缓存path
    if (qn.t === 'fp') {
      storepaths(data);
      return;
    }

    // group activeSelection
    // group deselect

    let canvas = null;
    try {
      canvas = await this.canvasRepository.findOne({ roomId });
    } catch (error) {
      this.logger.error('db error canvasRepository.findOne', { roomId, error });
    }
    const { objectIds } = await this.canvasRepository.findOne({ roomId });
    console.log('objectIds', objectIds, qn.oid);
    if (objectIds.includes(qn.oid)) {
      // 已有object 进行修改
      if (data.at) {
      } else {
        const _object = genObject(data);
        await this.fabricObjectRepository.save({
          id: qn.oid,
          object: _object,
        });
        this.logger.log('info', `更新已有画笔 ${qn.oid}`, _object);
      }
    } else {
      const _object = genObject(data);
      // await this.canvasRepository.save({
      //   roomId,
      //   objectIds: [qn.oid],
      // });
      objectIds.push(qn.oid);
      try {
        await this.fabricObjectRepository.save({
          id: qn.oid,
          object: _object,
          canvas: {
            roomId,
            objectIds,
          },
        });
      } catch (error) {
        this.logger.error('db error fabricObjectRepository.save', {
          roomId,
          error,
        });
      }
      this.logger.log('info', `新建画笔 ${qn.oid}`, _object);
    }
  }

  async cmdHandle(roomId: string, data: any) {
    const { cmd } = data;
    this.logger.log('info', `收到cmd消息`, data);
    if (cmd === 'clear') {
      let canvas = null;
      try {
        canvas = await this.canvasRepository.findOne({ roomId });
        if (!canvas.objectIds.length) {
          this.logger.warn(`roomId: ${roomId} 的 canvas 中没有 objectIds`);
          return;
        }
        const fabricObjects = await this.fabricObjectRepository.findByIds(
          canvas.objectIds,
        );
        await this.fabricObjectRepository.remove(fabricObjects);
        canvas.objectIds = [];
        await this.canvasRepository.save(canvas);
        this.logger.log('info', `清除画布成功， userId: ${data.uid}`);
      } catch (error) {
        this.logger.error('db error, cmd clear', { roomId, error });
      }
      this;
    }
  }

  // 批量修改保存到数据库
  async modifiedObjects(roomId: string, data: ModifiedObjects) {
    this.logger.log('info', `${roomId} 批量修改 objects`, data);
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
  async getFabricData(roomId: string) {
    const canvas = await this.canvasRepository.findOne(
      { roomId },
      { relations: ['objects'] },
    );
    this.logger.log('info', `获取历史画布 ${roomId}`);
    // 没有数据
    if (!canvas) {
      return null;
    }
    const { objects, cProps } = canvas;
    const objs = [];
    Object.keys(objects).forEach((key: string) => {
      const obj = objects[key];
      objs.push(obj.object);
    });
    return {
      version: '5.2.0',
      background: cProps.background,
      objects: objs,
    };
  }
}
