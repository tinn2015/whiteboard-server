import { Injectable, Inject, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getConnection } from 'typeorm';
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
   * 添加轨迹点
   */
  async addPath(pathobjs: addPathDto[]) {
    const saveObjects = pathobjs.map((pathObj) => {
      const { pageId, pathId, pathPoint, index } = pathObj;
      const saveObj = {
        pageId: pageId,
        pathId: pathId,
        // pathPoints: [{ point: pathPoint, index }],
        point: pathPoint,
        index: index,
        object: {
          id: pathId,
        },
      };
      return saveObj;
    });

    this.pathRepository.save(saveObjects);
  }

  /**
   * 批量添加轨迹
   * @param pathobj
   */
  async addPaths(paths: addPathDto[]) {
    const saveObjects = [];
    paths.forEach((pathobj) => {
      const { pageId, pathId, pathPoint, index } = pathobj;
      const saveObj = {
        pageId: pageId,
        pathId: pathId,
        point: pathPoint,
        index: index,
        object: {
          id: pathId,
        },
      };
      saveObjects.push(saveObj);
    });
    await this.pathRepository.save(saveObjects);
    return 'success';
  }

  async removePathsByPageId(pageId: number) {
    const connection = getConnection();
    await connection
      .createQueryBuilder()
      .delete()
      .from(Path)
      .where('pageId = :pageId', { pageId })
      .execute();
    // const paths = await this.pathRepository.find({ pageId: pageId });
    // await this.pathRepository.remove(paths);
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
    // const connection = getConnection();
    // await connection
    //   .createQueryBuilder()
    //   .delete()
    //   .from(Path)
    //   .where('pathId IN (:...pathIds)', { pathIds })
    //   .execute();
  }
}
