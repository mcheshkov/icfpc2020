import React from 'react';
import {useRef} from 'react';

import './App.css';

import {interact_galaxy} from 'fn_js/build/main';
import {
    drawMultiplePicture, WIDTH, HEIGHT, PIXEL_SIZE, dataToString, LamData,
    NumCons, LamList
} from 'fn_js/build/common';
import {nil, vec, convertToPicture} from 'fn_js/build/symbols';
import {ListCons} from 'fn_js/build/list';
import {modulateLam, demodulate, toLam} from "fn_js/build/modulation";

async function processClick(canvas: CanvasRenderingContext2D, x: number, y: number, state?: any): Promise<LamData> {
    console.log(`Sending click, x: ${x}, y: ${y}`);
    let [newState, imageData] = await interact_galaxy(x, y, state);
    console.log("State", modulateLam(newState));
    // console.log("Image", image);

    // console.log("Drawing new image");
    drawMultiplePicture((imageData as LamList).items.map(convertToPicture), canvas);
    // console.log("Finished drawing image");

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



/*
export const initState: LamData = 
    vec(
        NumCons(5n)
    )(
        vec(
            ListCons([
                NumCons(2n),
                NumCons(0n),
                ListCons([]), ListCons([]), ListCons([]), ListCons([]), ListCons([]),
                NumCons(20783n)
            ]
            )
        )(
            vec(
                NumCons(9n)
            )(
                ListCons([
                    ListCons([])
                ])
            )
        )
    ) as LamData;
*/

/*
export const initState: LamData = toLam(demodulate(
""
)[0]);
*/

function App() {
    // console.log("App is called");
    const canvasContainer = useRef<HTMLCanvasElement>(null);
    let canvas: HTMLCanvasElement;
    let canvasContext: CanvasRenderingContext2D;

    let state: LamData = initState;

    console.log("init state:", dataToString(initState));

    async function init() {
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
        state = await processClick(canvasContext, 0, 0, state);
    }

    setTimeout(init, 10);

    const handleClickEvent = async (e: any) => {
        let x = (e.pageX - canvas.offsetLeft - WIDTH/2) / PIXEL_SIZE | 0;
        let y = -(e.pageY - canvas.offsetTop - HEIGHT/2)  / PIXEL_SIZE | 0;

        state = await processClick(canvasContext, x, y, state);
    }

    return (
        <div className="App">
              <canvas ref={canvasContainer} onClick={handleClickEvent} width={WIDTH} height={HEIGHT}/>
        </div>
    );
}

export default App;
