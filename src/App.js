import React, { useState, useEffect } from 'react'
import randomWords from 'random-words'
import './styles.css'

const NUM_WORDS = 200;
const SPACE_KEYCODE = 32;
const ENTER_KEYCODE = 13;

function App() {
    const [words, setWords] = useState([])
    const [startingSeconds, setStartingSeconds] = useState(60)
    const [countDown, setCountDown] = useState(startingSeconds)
    const [currInput, setCurrInput] = useState('')
    const [currWordIndex, setCurrWordIndex] = useState(0)
    const [numCorrect, setNumCorrect] = useState(0)
    const [wordsPerMinute, setWordsPerMinute] = useState(0)
    const [intervalID, setIntervalID] = useState(0)
    const [status, setStatus] = useState('waiting')
    const [showStats, setShowStats] = useState(false)
    const [selectedButton, setSelectedButton] = useState(0)

    useEffect(() =>  {
        setWords(generateWords())
    }, [])

    // when selectedButton changes, reset and change the countdown total
    useEffect(() => {
        handleReset()
        switch (selectedButton){
            case 0:
                setCountDown(60)
                setStartingSeconds(60)
                break
            case 1: 
                setCountDown(120)
                setStartingSeconds(120)
                break
            case 2:
                setCountDown(240)
                setStartingSeconds(240)
                break
            default:
                break
        }
    }, [selectedButton])

    // calculate WPM whenever the timer changes
    useEffect(() => {
        // never update WPM unless timer running
        if (status === 'playing'){
            let wpm = Math.trunc((numCorrect / (startingSeconds - countDown))*100)
            // display 0 correctly at first second (ellapsed = 0)
            if (startingSeconds - countDown === 0) {
                if (numCorrect === 0) {
                    wpm = 0
                }
                else {
                    wpm = Math.trunc((numCorrect / 1)*100)
                }
            }

            setWordsPerMinute(wpm)
        }
    }, [countDown])

    // pressing enter anywhere on page resets
    document.onkeydown = function(evt) {
        evt = evt || window.event;
        if (evt.keyCode == ENTER_KEYCODE) {
            handleReset()
        }
    };

    function generateWords() {
        // generate array of random words
       return new Array(NUM_WORDS).fill(null).map(() => randomWords()); 
    }

    function startCountDown() {
        // begins counting down from SECONDS only if timer is original value
        if (status === 'waiting' || status === 'finished') {
            setStatus("playing")
            let interval = setInterval(() => {
                setCountDown((prevCountDown) => {
                    if (prevCountDown === 0) {
                        clearInterval(interval)
                        setStatus("finished")
                    }
                    else {
                        return prevCountDown - 1
                    }
                })
            }, 1000 )
            setIntervalID(interval)
        }
    } 

    function handleKeyDown({keyCode}) {
        /*actions to run when key is pressed in textbox*/

        if (keyCode === SPACE_KEYCODE) {
            // compare user and correct words
            const correctWord = words[currWordIndex]
            const match = correctWord === currInput.trim()

            // clear input
            setCurrInput('')
            setNumCorrect(match ? numCorrect + 1: numCorrect)

            // move to next word
            setCurrWordIndex(currWordIndex + 1)
        }
    }

    function handleReset() {
        /*actions performed with enter or reset button is hit: resets all relevant state*/

        // reset timer
        if (intervalID) {
            clearInterval(intervalID)
            setIntervalID(0)
        }

        setWords(generateWords())
        setStatus('waiting')
        setCurrInput('')
        setCurrWordIndex(0)
        setNumCorrect(0)
        setWordsPerMinute(0)
        setCountDown(startingSeconds)
    }

    function handleChange() {
        /* flips state in order to show statistics while typing */
        setShowStats(!showStats)
    }

    return (
        <div className='App'>
            <div className="columns">
                <div className="column is-1 is-offset-7 mt-4">
                    <div className="field has-addons">
                        <p className="control">
                            <button onClick={() => {setSelectedButton(0)}} className={`button is-ghost + ${selectedButton === 0 ? "is-link" : ""}`}>
                                <span className="icon is-small">
                                    <i className="fas">60</i>
                                </span>
                            </button>
                        </p>
                        <p className="control">
                            <button onClick={() => {setSelectedButton(1)}} className={`button is-ghost + ${selectedButton === 1 ? "is-link" : ""}`}>
                                <span className="icon is-small">
                                    <i className="fas fa-align-center">120</i>
                                </span>
                            </button>
                        </p>
                        <p className="control">
                            <button onClick={() => {setSelectedButton(2)}} className={`button is-ghost + ${selectedButton === 2 ? "is-link" : ""}`}>
                                <span className="icon is-small">
                                    <i className="fas fa-align-right">240</i>
                                </span>
                            </button>
                        </p>
                        </div>
                </div>
                <div className="column is-3 mt-5">
                    <label className="checkbox">
                        <input onChange={handleChange} type="checkbox"/>
                        Show stats while typing
                    </label>
                </div>
            </div>

            <div className="section">
                <div className="is-size-1 has-text-centered">
                    <h2>{countDown}</h2>
                </div>
            </div>

            {showStats && (
            <div className="columns">
                <div className="column is-4 is-offset-4">
                    <div className="is-size-4 has-text-centered box">
                        <h2>Accuracy {currWordIndex ? Math.trunc(((numCorrect / (currWordIndex)) * 100)) : 100}%</h2>
                        <h2>{wordsPerMinute}</h2>
                    </div>
                </div>
            </div>
            )}

            <div className='columns ml-5 mr-5'>
                <div className="column is-5 is-offset-3">
                    <input type="text" disabled={status === 'finished'} className="input" onKeyDown={function(event){ handleKeyDown(event); startCountDown(); }} value={currInput} onChange={(e) => setCurrInput(e.target.value)}/>
                </div>
                <div className="column is-1">
                    <div className="button button is-info is-half is-fluid" onClick={handleReset}>Reset</div>
                </div>
            </div>
            <div className='section'>
                <div className='card'>
                    <div className='card-content'>
                        <div className='content'>
                            {words.map((word, i) => (
                                // split word into char
                                <span key={i}>
                                    <span>
                                        { word.split('').map((char, idx) => (
                                            <span key={idx}>{char}</span>
                                        )) }
                                    </span>
                                    <span> </span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {status === 'finished' && (
                <div className="section">
                <div className="columns">
                    <div className="column is-half has-text-centered">
                        <div className="is-size-4 has-text-centered box">
                            <p className="is-size-5">Words per minute:</p>
                            <p>{wordsPerMinute}</p>
                        </div>
                    </div>
                    <div className="column is-half has-text-centered">
                        <div className="is-size-4 has-text-centered box">
                            <p className="is-size-5">Accuracy:</p>
                            <p>{currWordIndex ? Math.trunc(((numCorrect / (currWordIndex)) * 100)) : 100}%</p>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}

export default App;
