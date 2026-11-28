export function wrap(value,count){return ((value+count/2)%count+count)%count-count/2;}

export function mod(value,count){return ((value%count)+count)%count;}

export function scaleAt(distance){const t=Math.max(0,1-Math.abs(distance));return 0.86+0.26*t*t*(3-2*t);}

export function getLayout(width){return width>=1024?4.92:width>=640?3.12:1.76;}

// Shift the camera framing, not the individual meshes, on wide touch tablets.
export function getTabletLift(width, height, touch) {
    return touch && width >= 768 && width <= 1440 && width / height >= 1.2
        ? Math.round(height * .11)
        : 0;
}

export function getSnap(position,origin,velocity,canceled=false){if(canceled)return Math.round(origin);const delta=position-origin;if(Math.abs(delta)<0.17&&Math.abs(velocity)<0.0011)return Math.round(origin);const projected=position+Math.max(-1.25,Math.min(1.25,velocity*180));let target=Math.round(projected);if(target===Math.round(origin)&&Math.abs(delta)>=0.2)target+=Math.sign(delta);return Math.max(Math.round(origin)-3,Math.min(Math.round(origin)+3,target));}

export const centerWeight = distance => {
    const t = Math.max(0, 1 - Math.abs(distance));
    return t * t * (3 - 2 * t);
};

export const depthAt = distance => 0.42 * centerWeight(distance) - 0.22 * Math.min(2.5, Math.abs(distance));

export const rightTilt = -Math.PI / 15;

export const isSelected = (index, position, count) => index === mod(Math.round(position), count);

 
// All cans start on one plane, at equal size. The existing carousel pose is the endpoint.
export const introPoseAt = (distance, progress) => {
    const t = Math.max(0, Math.min(1, progress));
    return {
        y: -.11 + .20 * centerWeight(distance) * t,
        z: depthAt(distance) * t,
        scale: .86 + (scaleAt(distance) - .86) * t,
    };
};

// The adjacent pair leads the outer pair slightly, but both settle together.
export const introSpreadAt = (distance, progress) => {
    if (Math.abs(distance) < .01) return 1;
    const lag = Math.abs(distance) > 1.01 ? .13 : 0;
    const t = Math.max(0, Math.min(1, (progress - lag) / (1 - lag)));
    return t;
};
