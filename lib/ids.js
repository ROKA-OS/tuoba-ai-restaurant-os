// Collision-resistant ID generation.
// Old scheme: PREFIX + floor(Date.now()/1000) — collided within the same second.

let counter = 0;

function randomPart() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  }
  counter += 1;
  const rand = Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase().padStart(8, '0');
  return `${rand}-${counter.toString(16).toUpperCase()}`;
}

export function newId(prefix) {
  return `${prefix}-${randomPart()}`;
}

export function newOrderNo() {
  return newId('ORD');
}

export function newCallId() {
  return newId('CC');
}

export function newTxId() {
  return newId('TX');
}
