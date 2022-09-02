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
    const pathString = path.reduce((pre: string, cur: string[]) => {
      pre += ' ' + cur.join(' ');
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
  res.qn.isReceived = true;
  return res;
}

export function updateObj(data) {
  const { qn } = data;
}

export function storepaths(data) {
  const { qn } = data;
  const path = freePaths.get(qn.oid);
  if (!path) {
    freePaths.set(qn.oid, [data.path]);
  } else {
    path.push(data.path);
    freePaths.set(qn.oid, path);
  }
}

export function restorePath(oid: string, path: any[]) {
  freePaths.set(oid, path);
}
