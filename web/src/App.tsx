import React from 'react';
import {useRef} from 'react';

import logo from './logo.svg';
import './App.css';

import {main as fn_main} from 'fn_js/build/main';

function App() {
    const canvas = useRef<HTMLCanvasElement>(null);

    const handleClick = () => {
        if(canvas !== null) {
            let current = canvas.current;
            if(current !== null) {
                let context = current.getContext('2d');
                console.log(canvas.current);
                if(context !== null) {
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
