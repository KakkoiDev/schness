export const moveCursorSquare = ({ event, cursorSquare }) => {
  if (event.clientX) {
    cursorSquare.style.left =
      event.clientX - cursorSquare.clientWidth / 2 + "px";
    cursorSquare.style.top =
      event.clientY - cursorSquare.clientHeight / 2 + "px";
  } else {
    cursorSquare.style.left =
      event.changedTouches[0].clientX - cursorSquare.clientWidth / 2 + "px";
    cursorSquare.style.top =
      event.changedTouches[0].clientY - cursorSquare.clientHeight / 2 + "px";
  }
};
