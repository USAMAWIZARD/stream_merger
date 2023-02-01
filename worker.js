const canvas = new OffscreenCanvas(1, 1);
const ctx = canvas.getContext("2d");
const abortController = new AbortController();

let config = {
  size: 250,
  margin: 20,
  position: 'bottom-left', // top-left, top-right, bottom-left, bottom-right
}

const calculateAvatarPosition = (width, height) => {
  let dx, dy;
  switch (config.position) {
    case 'top-left':
      dx = config.margin;
      dy = config.margin;
      break;
    case 'top-right':
      dx = width - (config.size + config.margin);
      dy = config.margin;
      break;
    case 'bottom-right':
      dx = width - (config.size + config.margin);
      dy = height - (config.size + config.margin);
      break;
    case 'bottom-left':
      dx = config.margin;
      dy = height - (config.size + config.margin);
      break;
    default:
      dx = config.margin;
      dy = height - (config.size + config.margin);
      break;
  }

  return { dx, dy };
}

const compose = (cameraReadableStream, screenReadableStream, sink) => {
  const camaraReader = cameraReadableStream.getReader();
  streamReader = [camaraReader];
  const { signal } = abortController
  let screenFrame;
  const transformer = new TransformStream({
    async transform(cameraFrame, controller) {
      for (i = 0; i < streamReader.length; i++) {
        if (screenFrame) {
          screenFrame.close();
        }
        streamReader[i].read().then((frame)=>{
          screenFrame = frame.value;
          if (screenFrame && screenFrame?.displayWidth > 0) {
            canvas.width = screenFrame.displayWidth
            canvas.height = screenFrame.displayHeight;
            ctx.drawImage(screenFrame, 0, 0, canvas.width, canvas.height);
            ctx.drawImage(cameraFrame, 50, 180, 250, 70, 271, 220, 40, 20);
  
            const newFrame = new VideoFrame(canvas, { timestamp: 0 });
            cameraFrame.close();
            controller.enqueue(newFrame);
          } else {
            controller.enqueue(cameraFrame);
          }
        })

      }


    }
  })

  screenReadableStream.pipeThrough(transformer, { signal }).pipeTo(sink);
}

onmessage = async (event) => {
  const { operation } = event.data;
  switch (operation) {
    case 'compose':
      const { cameraReadableStream, screenReadableStream, sink } = event.data;
      compose(cameraReadableStream, screenReadableStream, sink);
      break;
    case 'stop':
      abortController.abort();
      break;
    case 'config':
      config = { ...config, ...event.data };
      break;
  }
}