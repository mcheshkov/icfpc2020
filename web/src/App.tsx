import React from 'react';
import {useRef} from 'react';

import logo from './logo.svg';
import './App.css';

import {main as fn_main} from 'fn_js/build/main';

function App() {
    const canvas = useRef<HTMLCanvasElement>(null);

    const PIXEL_SIZE = 5;
    const WIDTH = 300;
    const HEIGHT = 300;

    const handleClick = (e: any) => {
        console.log(e);
        if(canvas !== null) {
            let current = canvas.current;
            if(current !== null) {
                let context = current.getContext('2d');
                console.log(canvas.current);
                if(context !== null) {
                    let x = (e.pageX - current.offsetLeft - WIDTH/2) / PIXEL_SIZE | 0;
                    let y = -(e.pageY - current.offsetTop - HEIGHT/2)  / PIXEL_SIZE | 0;

                    console.log(x, y);

                    fn_main(context);
                }
            }
        }
    }

    return (
        <div className="App">
              <canvas ref={canvas} onClick={handleClick} width={300} height={300}/>
        </div>
    );
}

export default App;
