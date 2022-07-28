import { Injectable, Logger, Inject, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Canvas } from '../entities/canvas.entity';
import { FabricObject } from '../entities/fabricObject.entity';
import { storepaths, genObject } from './drawUtils';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

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
    // const cData = await this.canvasRepository.findOne({ roomId });
    // console.log('cData', cData);
    const { qn } = data;
    this.logger.log('info', `draw ${qn.t}`, qn);

    // 缓存path
    if (qn.t === 'fp') {
      storepaths(data);
      return;
    }

    const { objectIds } = await this.canvasRepository.findOne({ roomId });
    console.log('objectIds', objectIds, qn.oid);
    if (objectIds.includes(qn.oid)) {
      // 已有object 进行修改
      const _object = genObject(data);
      await this.fabricObjectRepository.save({
        id: qn.oid,
        object: _object,
      });
      this.logger.log('info', `更新已有画笔 ${qn.oid}`, _object);
    } else {
      const _object = genObject(data);
      // await this.canvasRepository.save({
      //   roomId,
      //   objectIds: [qn.oid],
      // });
      objectIds.push(qn.oid);
      await this.fabricObjectRepository.save({
        id: qn.oid,
        object: _object,
        canvas: {
          roomId,
          objectIds,
        },
      });
      console.log(`room ${roomId} canvas 不存在`);
      this.logger.log('info', `新建画笔 ${qn.oid}`, _object);
    }
  }

  // 历史画布数据
  async getFabricData(roomId: string) {
    const canvas = await this.canvasRepository.findOne(
      { roomId },
      { relations: ['objects'] },
    );
    this.logger.log('info', `获取历史画布 ${roomId}`, canvas);
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
