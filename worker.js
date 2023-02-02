const canvas = new OffscreenCanvas(1000,1000);
const ctx = canvas.getContext("2d");
const abortController = new AbortController();
var streamReader=[];
var firstStream=null
let config = {
  size: 250,
  margin: 20,
  position: 'bottom-left', // top-left, top-right, bottom-left, bottom-right
}
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

const compose = (ReadableStreams, sink) => {

  const { signal } = abortController
  let writeFrames;
  const transformer = new TransformStream({
    async transform(cameraFrame, controller) {

      for (i = 0; i < streamReader.length; i++) {
        streamReader[i].read().then((frame)=>{
          writeFrames = frame.value;
        //  console.log(writeFrames.displayWidth,cameraFrame.displayWidth)
          ctx.drawImage(writeFrames, writeFrames.displayWidth,writeFrames.displayHeight, 400, 400);
          writeFrames.close();
         
        })

      }
      ctx.drawImage(cameraFrame, 0, 0, 900, 900, 0,0 , 400, 400);

      const newFrame = new VideoFrame(canvas, { timestamp: 0 });

      cameraFrame.close();
      controller.enqueue(newFrame);
    }
  })

  ReadableStreams.pipeThrough(transformer, { signal }).pipeTo(sink);
}

onmessage = async (event) => {
  const { operation } = event.data;
  switch (operation) {
    case 'addStream':

      const { newReadableStream, sink } = event.data;
      console.log(newReadableStream, sink)
      console.log(event.data)
      if(firstStream!=null){
        streamReader.push(newReadableStream.getReader())
      }
      else{
        firstStream = event.data.newReadableStream,
        compose(event.data.newReadableStream, event.data.sink);
      }
     
      break;
    case 'stop':
      abortController.abort();
      break;
    case 'config':
      config = { ...config, ...event.data };
      break;
  }
}