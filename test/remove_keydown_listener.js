const target = document.querySelector('#vjs_video_3');
const listenerList = getEventListeners(target);
target.removeEventListener('keydown', listenerList.keydown[0].listener);