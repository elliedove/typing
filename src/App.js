import React, { useState, useEffect } from 'react'
import randomWords from 'random-words'
import './styles.css'

const NUM_WORDS = 200
const SPACE_KEYCODE = 32
const ENTER_KEYCODE = 13
const BACKSPACE_KEYCODE = 8
const A_KEYCODE = 65
const Z_KEYCODE = 90
const CTRL_KEYCODE = 17

function App() {
    const [words, setWords] = useState([])
    const [finishedWords, setFinishedWords] = useState([])
    const [startingSeconds, setStartingSeconds] = useState(30)
    const [countDown, setCountDown] = useState(startingSeconds)
    const [currInput, setCurrInput] = useState('')
    const [currWordIndex, setCurrWordIndex] = useState(0)
    const [currCharIndex, setCurrCharIndex] = useState(-1)
    const [numCorrect, setNumCorrect] = useState(0)
    const [wordsPerMinute, setWordsPerMinute] = useState(0)
    const [intervalID, setIntervalID] = useState(0)
    const [status, setStatus] = useState('waiting')
    const [showStats, setShowStats] = useState(false)
    const [selectedButton, setSelectedButton] = useState(2)

    useEffect(() =>  {
        setWords(generateWords())
    }, [])

    // when selectedButton changes, reset and change the countdown total
    useEffect(() => {
        handleReset()
        switch (selectedButton){
            case 0:
                setCountDown(15)
                setStartingSeconds(15)
                break
            case 1: 
                setCountDown(30)
                setStartingSeconds(30)
                break
            case 2:
                setCountDown(60)
                setStartingSeconds(60)
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
            const correctWord = words[0]
            const match = correctWord === currInput.trim()

            // clear input
            setCurrInput('')
            setNumCorrect(match ? numCorrect + 1: numCorrect)

            // move to next word
            setFinishedWords([...finishedWords, correctWord])
            setWords(words.slice(1))
            // setCurrWordIndex(currWordIndex)
            setCurrCharIndex(-1)
        }

        else if (status === 'playing' && (keyCode === CTRL_KEYCODE)){
            setCurrCharIndex(-1)  
        }
        
        else if (status === 'playing' && keyCode === BACKSPACE_KEYCODE) {
            // dont go below 0
            setCurrCharIndex(currCharIndex > 0 ? currCharIndex - 1 : -1)
        }
        // only letter inputs
        else if (keyCode >= A_KEYCODE && keyCode <= Z_KEYCODE) {
            // move onto next letter
            setCurrCharIndex(currCharIndex + 1)  
        }

    }

    function handleReset() {
        /*actions performed with enter or reset button is hit: resets all relevant state*/

        // reset timer
        if (intervalID) {
            clearInterval(intervalID)
            setIntervalID(0)
        }
        setFinishedWords([])
        setWords(generateWords())
        setStatus('waiting')
        setCurrInput('')
        // setCurrWordIndex(0)
        setCurrCharIndex(-1)
        setNumCorrect(0)
        setWordsPerMinute(0)
        setCountDown(startingSeconds)
    }

    function handleChange() {
        /* flips state in order to show statistics while typing */
        setShowStats(!showStats)
    }

    function getCharColor(wordIndex, charIndex, char, word) {
        /*Determines color of each letter according to correctness*/
        if (status=== 'playing' && wordIndex === 0 && charIndex === currCharIndex && currInput) {
            if (char === currInput.slice(-1)) {
                return (<span className="has-text-grey">{char}</span>)
            }
            else {
                return (<span className="has-text-danger">{char}</span>)
            }
        }
        else {
            return (<span className="has-text-light">{char}</span>)
        }
    }

    return (
        <div className='App'>
            <div className="columns">
                <div className="column is-1 is-offset-7 mt-4">
                    <div className="field has-addons">
                        <p className="control">
                            <button onClick={() => {setSelectedButton(0)}} className={`button is-ghost + ${selectedButton === 0 ? "is-link" : ""}`}>
                                <span className="icon is-small">
                                    <i className="fas">15</i>
                                </span>
                            </button>
                        </p>
                        <p className="control">
                            <button onClick={() => {setSelectedButton(1)}} className={`button is-ghost + ${selectedButton === 1 ? "is-link" : ""}`}>
                                <span className="icon is-small">
                                    <i className="fas fa-align-center">30</i>
                                </span>
                            </button>
                        </p>
                        <p className="control">
                            <button onClick={() => {setSelectedButton(2)}} className={`button is-ghost + ${selectedButton === 2 ? "is-link" : ""}`}>
                                <span className="icon is-small">
                                    <i className="fas fa-align-right">60</i>
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
                        <h2>Accuracy {finishedWords.length ? Math.trunc(((numCorrect / (finishedWords.length)) * 100)) : 100}%</h2>
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
                    <div className='card-content has-background-dark has-text-light'>
                        <div className='content'>
                            {Array.isArray(finishedWords) ? finishedWords.map((word, i) => (
                                // split word into char
                                <span key={i}>
                                    <span>
                                        { word.split('').map((char) => (
                                            <span className="has-text-grey">{char}</span>
                                        )) }
                                    </span>
                                    <span> </span>
                                </span>
                            )) : null}
                            {words.map((word, i) => (
                                // split word into char
                                <span key={i}>
                                    <span>
                                        { word.split('').map((char, idx) => (
                                            getCharColor(i, idx, char, word)
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
                            <p>{finishedWords.length ? Math.trunc(((numCorrect / (finishedWords.length)) * 100)) : 100}%</p>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}

export default App;
