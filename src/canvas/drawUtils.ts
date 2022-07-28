import { fabric } from 'fabric';

const freePaths = new Map();

export function genObject(data: any) {
  const { qn } = data;
  let obj = { qn, type: '' };
  if (qn.t === 'path') {
    const path = freePaths.get(qn.oid);
    const pathString = path.reduce((pre: string, cur: string[]) => {
      pre += ' ' + cur.join(' ');
      return pre;
    }, '');
    freePaths.delete(qn.oid);
    console.log('freePaths', freePaths);
    obj = new fabric.Path(pathString, data);
  } else if (qn.t === 'rect') {
    obj = new fabric.Rect(data);
  } else if (qn.t === 'circle') {
    obj = new fabric.Circle(data);
  }
  obj.qn = qn;
  return obj;
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
