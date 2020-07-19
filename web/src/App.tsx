import React from 'react';
import {useRef} from 'react';

import './App.css';

import {interact} from 'fn_js/build/main';
import {
    drawMultiplePicture, WIDTH, HEIGHT, PIXEL_SIZE, dataToString, LamData,
    NumCons
} from 'fn_js/build/common';
import {nil, vec} from 'fn_js/build/symbols';
import {ListCons} from 'fn_js/build/list';

function processClick(canvas: CanvasRenderingContext2D, x: number, y: number, state?: any): LamData {
    console.log(`Sending click, x: ${x}, y: ${y}`);
    let [flag, newState, image] = interact(x, y, state);
    console.log("Interact results", flag, newState, image);
    console.log("State", dataToString(newState));

    console.log("Drawing new image");
    drawMultiplePicture(image, canvas);
    console.log("Finished drawing image");

    return newState;
}

export const initState: LamData = vec(
    NumCons(1n)
)(
    vec(
        ListCons([NumCons(11n)])
    )(
        ListCons([NumCons(0n), ListCons([])])
    )
) as LamData;

function App() {
    console.log("App is called");
    const canvasContainer = useRef<HTMLCanvasElement>(null);
    let canvas: HTMLCanvasElement;
    let canvasContext: CanvasRenderingContext2D;

    let state: LamData = initState;

    console.log("init state:", dataToString(initState));

    function init() {
        if (!canvasContainer.current) {
            // Почему-то эта функция вызывается дважды, первый раз ещё canvas.current не готов
            return;
        }
        canvas = canvasContainer.current
        let context = canvas.getContext('2d');
        if (!context) {
            throw new Error("Cannot draw in your browser");
        }
        canvasContext = context;
        state = processClick(canvasContext, 0, 0, state);
    }

    setTimeout(init, 10);

    const handleClickEvent = (e: any) => {
        let x = (e.pageX - canvas.offsetLeft - WIDTH/2) / PIXEL_SIZE | 0;
        let y = -(e.pageY - canvas.offsetTop - HEIGHT/2)  / PIXEL_SIZE | 0;

        state = processClick(canvasContext, x, y, state);
    }

    return (
        <div className="App">
              <canvas ref={canvasContainer} onClick={handleClickEvent} width={WIDTH} height={HEIGHT}/>
        </div>
    );
}

export default App;
