import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { decode } from '@msgpack/msgpack';

// if (isMainThread) {
//   module.exports = function drawCanvas(script) {
//     return new Promise((resolve, reject) => {
//       const worker = new Worker(__filename, {
//         workerData: script,
//       });
//       worker.on('message', resolve);
//       worker.on('error', reject);
//       worker.on('exit', (code) => {
//         if (code !== 0)
//           reject(new Error(`Worker stopped with exit code ${code}`));
//       });
//     });
//   };
// } else {
//   const script = workerData;
//   parentPort.postMessage(decode(script));
// }

// function drawCanvas(data) {
//   if (isMainThread) {
//     const worker = new Worker(__filename, { workerData: { num: 5 } });
//     // console.log('worker', worker);
//     worker.on('message', (result) => {
//       console.log('square of 5 is :', result);
//     });
//   } else {
//     parentPort.postMessage(workerData.num * workerData.num);
//   }
// }
// parentPort.postMessage(workerData);
export default ({ a, b }) => {
  console.log('111');
  return a + b;
};
