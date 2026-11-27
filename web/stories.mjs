import viewpoints from './viewpoints.json' with {type: 'json'};

// The historic album guides have two dated photographs. The Halifax ferry
// terminal instead draws its stop evidence from the weekly municipal index.
export {viewpoints};
export const stories = Object.fromEntries(Object.entries(viewpoints).filter(([,stop]) => stop.records?.length));
