export const moveCursorSquare = ({ event, cursorSquare }) => {
  cursorSquare.style.left = event.pageX - cursorSquare.clientWidth / 2 + "px";
  cursorSquare.style.top = event.pageY - cursorSquare.clientHeight / 2 + "px";
};
