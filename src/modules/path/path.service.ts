import { Injectable, Inject, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { addPathDto } from './dto/add-path.dto';
import { GetPathDto } from './dto/get-path.dto';
import { Path } from '../../entities/path.entity';
import { AsyncQueue } from '../../utils/asyncQueue';

// import { Room } from './interfaces/rooms.interface'

@Injectable()
export class PathService {
  // asyncQueue: AsyncQueue;
  constructor(
    @InjectRepository(Path) private pathRepository: Repository<Path>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    // this.asyncQueue = new AsyncQueue();
  }
  /**
   * 获取path
   */
  async getPath(getPathDto: GetPathDto) {
    return await this.pathRepository.find({ pathId: getPathDto.pathId });
  }

  /**
   * 添加轨迹
   */
  async addPath(pathobj: addPathDto) {
    const { pageId, pathId, pathPoint, index } = pathobj;
    const saveObj = {
      pageId: pageId,
      pathId: pathId,
      // pathPoints: [{ point: pathPoint, index }],
      point: pathPoint,
      index: index,
    };
    this.pathRepository.save(saveObj);
    // this.asyncQueue.push({
    //   handler: async () => {
    //     const pathEntity = await this.pathRepository.findOne({
    //       pathId: pathId,
    //     });
    //     if (!pathEntity) {
    //       const saveObj = {
    //         pageId: pageId,
    //         pathId: pathId,
    //         pathPoints: [{ point: pathPoint, index }],
    //       };
    //       return await this.pathRepository.save(saveObj);
    //     } else {
    //       const { pathPoints } = pathEntity;
    //       pathPoints.push({ point: pathPoint, index });
    //       return await this.pathRepository.save(pathEntity);
    //     }
    //   },
    // });
  }

  async removePathsByPageId(pageId: number) {
    const paths = await this.pathRepository.find({ pageId: pageId });
    await this.pathRepository.remove(paths);
    return;
  }

  /**
   * 删除某个path的轨迹
   */
  async removePath(pathIds: string[], pageId: number) {
    if (!pathIds.length) return;
    const pathEntities = await (
      await this.pathRepository.find({ pageId: pageId })
    ).filter((item) => pathIds.includes(item.pathId));
    console.log('removePath', pathIds, pathEntities.length);
    await this.pathRepository.remove(pathEntities);
  }
}
