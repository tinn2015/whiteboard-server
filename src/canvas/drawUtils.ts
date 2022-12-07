import { fabric } from 'fabric';

const freePaths = new Map();

type Shape = fabric.Circle | fabric.Rect | fabric.Path | fabric.Triangle;

export function genObject(data: any) {
  const { qn } = data;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let obj: Shape;
  if (qn.t === 'path') {
    const path = freePaths.get(qn.oid);
    if (!path) {
      return;
    }
    const pathString = path
      .sort((a, b) => a.index - b.index)
      .reduce((pre, cur) => {
        pre += ' ' + cur.path.join(' ');
        return pre;
      }, '');
    freePaths.delete(qn.oid);
    console.log('freePaths', freePaths);
    obj = new fabric.Path(pathString, data);
  } else if (qn.t === 'rect') {
    obj = new fabric.Rect(data);
  } else if (qn.t === 'triangle') {
    obj = new fabric.Triangle(data);
  } else if (qn.t === 'circle') {
    obj = new fabric.Circle(data);
  } else if (qn.t === 'line') {
    const { x1, x2, y1, y2 } = data;
    const points = [x1, y1, x2, y2];
    obj = new fabric.Line(points, data);
  }
  if (!obj) {
    return null;
  }
  const res = obj.toObject();
  res.qn = qn;
  res.qn.sync = false;
  return res;
}

export function updateObj(data) {
  const { qn } = data;
}

/**
 * 保存path 轨迹
 * @param data
 */
export function storepaths(data) {
  const { qn } = data;
  const path = freePaths.get(qn.oid);
  console.log('path', data);
  if (!path) {
    freePaths.set(qn.oid, [{ path: data.path, index: data.index }]);
  } else {
    path.push({ path: data.path, index: data.index });
    freePaths.set(qn.oid, path);
  }
}

export function restorePath(oid: string, path: any[]) {
  freePaths.set(oid, path);
}

export function removeStorePath(oids) {
  if (oids && oids.length) {
    oids.forEach((oid) => {
      freePaths.delete(oid);
    });
  }
}
