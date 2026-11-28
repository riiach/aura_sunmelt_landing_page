export function wrap(value,count){return ((value+count/2)%count+count)%count-count/2;}

export function mod(value,count){return ((value%count)+count)%count;}

export function scaleAt(distance) {
    const d = Math.abs(distance);
    const center = Math.max(0, 1 - d);
    const outer = Math.max(0, Math.min(1, d - 1));
    // Keep the selected and adjacent cans; taper the outer pair smoothly.
    return .86 + .26 * center * center * (3 - 2 * center) - .13 * outer * outer * (3 - 2 * outer);
}

export function getLayout(width){return width>=1024?4.92:width>=640?3.12:1.76;}

export function getSnap(position,origin,velocity,canceled=false){if(canceled)return Math.round(origin);const delta=position-origin;if(Math.abs(delta)<0.17&&Math.abs(velocity)<0.0011)return Math.round(origin);const projected=position+Math.max(-1.25,Math.min(1.25,velocity*180));let target=Math.round(projected);if(target===Math.round(origin)&&Math.abs(delta)>=0.2)target+=Math.sign(delta);return Math.max(Math.round(origin)-3,Math.min(Math.round(origin)+3,target));}

export const centerWeight = distance => {
    const t = Math.max(0, 1 - Math.abs(distance));
    return t * t * (3 - 2 * t);
};

export const depthAt = distance => 0.42 * centerWeight(distance) - 0.22 * Math.min(2.5, Math.abs(distance));

export const rightTilt = -Math.PI / 15;

export const isSelected = (index, position, count) => index === mod(Math.round(position), count);

 
// Scale fans out with the opening spread, independently of the later lift/tilt.
// Calls from the About transition retain their original progress-only behavior.
export const introPoseAt = (distance, progress, spreadProgress = progress) => {
    const t = Math.max(0, Math.min(1, progress));
    const scaleProgress = Math.max(t, Math.max(0, Math.min(1, spreadProgress)));
    return {
        y: -.11 + .20 * centerWeight(distance) * t,
        z: depthAt(distance) * t,
        scale: .86 + (scaleAt(distance) - .86) * scaleProgress,
    };
};

// The adjacent pair leads the outer pair slightly, but both settle together.
export const introSpreadAt = (distance, progress) => {
    if (Math.abs(distance) < .01) return 1;
    const lag = Math.abs(distance) > 1.01 ? .13 : 0;
    const t = Math.max(0, Math.min(1, (progress - lag) / (1 - lag)));
    return t;
};
