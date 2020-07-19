import React from 'react';
import {useRef} from 'react';

import './App.css';

import {interact, LamData} from 'fn_js/build/main';
import {drawMultiplePicture} from 'fn_js/build/common'
import {nil} from 'fn_js/build/symbols';

function processClick(canvas: CanvasRenderingContext2D, x: number, y: number, state?: any): LamData {
    console.log("Sending click", x, y);
    let [flag, newState, image] = interact(0, 0, state);
    console.log("Interact results", flag, newState, image);

    console.log("Drawing new image");
    drawMultiplePicture(image, canvas);
    console.log("Finished drawing image");

    return newState;
}

function App() {
    console.log("App is called");
    const canvasContainer = useRef<HTMLCanvasElement>(null);
    let canvas: HTMLCanvasElement;
    let canvasContext: CanvasRenderingContext2D;

    const PIXEL_SIZE = 5;
    const WIDTH = 300;
    const HEIGHT = 300;

    let state: LamData = nil;

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
        state = processClick(canvasContext, 0, 0);
    }

    setTimeout(init, 10);

    const handleClickEvent = (e: any) => {
        let x = (e.pageX - canvas.offsetLeft - WIDTH/2) / PIXEL_SIZE | 0;
        let y = -(e.pageY - canvas.offsetTop - HEIGHT/2)  / PIXEL_SIZE | 0;

        console.log("Got click", x, y);

        state = processClick(canvasContext, x, y, state);
    }

    return (
        <div className="App">
              <canvas ref={canvasContainer} onClick={handleClickEvent} width={300} height={300}/>
        </div>
    );
}

export default App;
