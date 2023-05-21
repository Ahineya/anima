export const sortByOrder = (a: { [key: string]: any, order: string }, b: { [key: string]: any, order: string }) => {
  if (a.order < b.order) {
    return -1;
  }

  if (a.order > b.order) {
    return 1;
  }

  return 0;
}
