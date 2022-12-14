import React, { useState, useEffect } from 'react'
import randomWords from 'random-words'
import Icon from '@mdi/react'
import 'bulma-list/css/bulma-list.css'
import { mdiCog, mdiCloseCircle, mdiCompassOutline } from '@mdi/js'
import './styles.css'

const NUM_WORDS = 200
const WORDS_PER_ROW = 10

function App() {
    const [words, setWords] = useState([])
    const [finishedWords, setFinishedWords] = useState([])
    const [completedTests, setCompletedTests] = useState([])
    const [startingSeconds, setStartingSeconds] = useState(30)
    const [countDown, setCountDown] = useState(startingSeconds)
    const [currInput, setCurrInput] = useState('')
    const [currCharIndex, setCurrCharIndex] = useState(-1)
    const [numCorrect, setNumCorrect] = useState(0)
    const [numComplete, setNumComplete] = useState(0)
    const [wordsPerMinute, setWordsPerMinute] = useState(0)
    const [intervalID, setIntervalID] = useState(0)
    const [status, setStatus] = useState('waiting')
    const [showStats, setShowStats] = useState(false)
    const [selectedButton, setSelectedButton] = useState(1)
    const [modalActive, setModalActive] = useState(false)
    const [modalInput, setModalInput] = useState("") 

    useEffect(() =>  {
        setWords(generateWords())

        // get stored past tests
        const data = window.localStorage.getItem('TYPING_APP_STATE');
        if ( data !== null ) setCompletedTests(JSON.parse(data));
    }, [])


    // update 'finished tests' list when a test is finished
    useEffect(() => {
        if (status === "finished") {
            var newCompleted = [{
                'datetime': getDateTime(),
                'wpm': wordsPerMinute,
                'accuracy': numComplete ? Math.trunc(((numCorrect / (numComplete)) * 100)) : 100,
                'lengthSec': startingSeconds,
            }, ...completedTests]

            setCompletedTests(newCompleted)

            // cache 
            window.localStorage.setItem('TYPING_APP_STATE', JSON.stringify(newCompleted));
        }
    }, [status])

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
        if (evt.key === "Enter") {
            handleReset()
        }

        if (evt.key === "Escape" && modalActive) {
            handleModalActive()
        }
    };

    const handleModalInput = event => {
        setModalInput(event.target.value)
    }

    function getDateTime() {
        /*generated month/day string*/
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var time = today.toLocaleString("en-US", {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
        today = mm + '/' + dd
        return [today, time]
    }

    function generateWords() {
        // generate array of random words
        let arr = new Array(NUM_WORDS).fill(null).map(() => randomWords()); 
        let res = []
        for (let i = 0; i < arr.length; i = i + WORDS_PER_ROW) {
            res.push(arr.slice(i, i + WORDS_PER_ROW))
        }

        return res
    }

    function startCountDown({key}) {
        // begins counting down from SECONDS only if timer is original value
        if ((key >= 'a' && key <= 'z') && (status === 'waiting' || status === 'finished')) {
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

    function handleKeyDown({key}) {
        /*actions to run when key is pressed in textbox*/
        if (key === " " && status == 'playing') {
            // compare user and correct words
            const correctWord = words[0][0]
            const match = correctWord === currInput.trim()

            // clear input
            setCurrInput('')
            setNumCorrect(match ? numCorrect + 1: numCorrect)
            setNumComplete(numComplete + 1)
            console.log(numCorrect, numComplete)

            // move to next word
            setFinishedWords([...finishedWords, correctWord])

            // remove the row if finished
            if (words[0].length === 1) {
                setWords([...words.slice(1)])
                setFinishedWords([])
            }
            // only remove the current word if more remain
            else {
                setWords([...[words[0].slice(1)], ...words.slice(0 + 1)])
                
            }

            setCurrCharIndex(-1)
        }

        else if (status === 'playing' && key === "Control"){
            setCurrCharIndex(-1)  
        }
        
        else if (status === 'playing' && key === "Backspace") {
            // dont go below 0
            setCurrCharIndex(currCharIndex > 0 ? currCharIndex - 1 : -1)
        }
        // only letter inputs
        else if (key >= "a" && key <= "z") {
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
        setCurrCharIndex(-1)
        setNumCorrect(0)
        setNumComplete(0)
        setWordsPerMinute(0)
        setCountDown(startingSeconds)
    }

    function handleChange() {
        /* flips state in order to show statistics while typing */
        setShowStats(!showStats)
    }

    function getCharColor(rowIndex, wordIndex,  charIndex, char) {
        /*Determines color of each letter according to correctness*/
        if (status === 'playing' && rowIndex === 0 && wordIndex === 0 && charIndex === currCharIndex && currInput) {
            if (char === currInput.slice(-1)) {
                return (<span className="has-text-grey is-size-4">{char}</span>)
            }
            else {
                return (<span className="has-text-danger is-size-4">{char}</span>)
            }
        }
        else {
            return (<span className="has-text-light is-size-4">{char}</span>)
        }
    }

    function handleModalActive() {
        if (modalActive) {
            setModalActive(false)
        }
        else {
            setModalActive(true)
        }
    }


    function handleSaveTimer() {
        // if user input is a number <= 900 -> use this number
        if (!isNaN(modalInput) && modalInput > 0) {
            setStartingSeconds(modalInput)
            setCountDown(modalInput)
            handleModalActive()
        }
    }    

    function handleClearHistory() {
        /*resets completed test history */
        setCompletedTests([])
        window.localStorage.clear()
    }

    const handleRemoveTest = (e) => {
        /*removes single test from history */
        var index = e.currentTarget.id
        var newArr = [...completedTests]
        newArr.splice(index, 1)
        setCompletedTests(newArr)

        window.localStorage.setItem('TYPING_APP_STATE', JSON.stringify(newArr));
    }

    return (
        <div className='App'>
            <div className={`modal ${modalActive ? "is-active": ""}`}>
                <div className="modal-background"></div>
                <div className="modal-card has-background-dark">
                    <header className="modal-card-head">
                        <p className="modal-card-title">Change duration</p>
                        <button className="delete" aria-label="close" onClick={handleModalActive}></button>
                    </header>
                    <section className="modal-card-body">
                        Test duration: {isNaN(modalInput) ? startingSeconds : modalInput}
                        <input type='text' className='input' defaultValue={startingSeconds} onChange={handleModalInput}/>
                    </section>
                    <footer className="modal-card-foot">
                        <button className="button" onClick={handleSaveTimer}>Save changes</button>
                        <button className="button" onClick={handleModalActive}>Cancel</button>
                    </footer>
                </div>
            </div>
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
                        <p className="control">
                            <button onClick={() => {handleModalActive(); setSelectedButton(3)}} className={`button is-ghost + ${selectedButton === 3 ? "is-link" : ""}`}>
                                <span className="icon is-small">
                                    <Icon path={mdiCog} size={3}/>
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
                        <h2>Accuracy {numComplete ? Math.trunc(((numCorrect / (numComplete)) * 100)) : 100}%</h2>
                        <h2>{wordsPerMinute}</h2>
                    </div>
                </div>
            </div>
            )}
            <div className='columns ml-5 mr-5'>
                <div className="column is-5 is-offset-3">
                    <input type="text" disabled={status === 'finished'} className="input" onKeyDown={function(event){ handleKeyDown(event); startCountDown(event); }} value={currInput} onChange={(e) => setCurrInput(e.target.value)}/>
                </div>
                <div className="column is-1">
                    <div className="button button is-half is-fluid is-link" onClick={handleReset}>Reset</div>
                </div>
            </div>
            <div className='section'>
                <div className='card ml-5 mr-5'>
                    <div className='card-content has-background-dark has-text-light'>
                        <div className='content'>
                            {Array.isArray(finishedWords) ? finishedWords.map((word, i) => (
                                // split word into char
                                <span key={i}>
                                    <span>
                                        { word.split('').map((char) => (
                                            <span className="has-text-grey is-size-4">{char}</span>
                                        )) }
                                    </span>
                                    <span className='is-size-4'> </span>
                                </span>
                            )) : null}
                            { words.slice(0,3).map((row, i) => (
                                // split row into words
                                <span key={i}> 
                                    <span>
                                    {row.map((word, j) => (
                                        <span>
                                            <span>{ word.split('').map((char, idx) => (
                                                getCharColor(i, j, idx, char, word)
                                            )) }</span>
                                        <span className='is-size-4'> </span>
                                        </span>
                                    )) }
                                    </span>
                                    <br></br>
                                </span>
                            )) }
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
                            <p>{numComplete ? Math.trunc(((numCorrect / (numComplete)) * 100)) : 100}%</p>
                        </div>
                    </div>
                </div>
            </div>
            )}
            {(completedTests.length > 0 && 
                <div className="section">
                    <div className="columns is-gapless">
                        <div className="column is-2 is-offset-1">
                            <div className="button button is-half is-fluid is-link" onClick={handleClearHistory}>Clear history</div>
                        </div>
                    </div>  
                    <div className="box has-background-dark">
                        <div className="list">
                            {completedTests.map((test, testIndex) => (
                                <div className="list-item">
                                    <div className="list-item-content">
                                        <div className="list-item-title has-text-white">{test.datetime[0]} - {test.datetime[1]}</div>
                                        <div className="list-item-description has-text-gray">
                                            <p>{test.lengthSec} seconds</p>
                                            <p>{test.wpm} words per minute | {test.accuracy}% accuracy</p>
                                        </div>
                                    </div>
                                    <div className="list-item-controls">
                                        <div className="buttons is-right">
                                            <button id={testIndex} className="button has-background-grey-light" onClick={handleRemoveTest}>
                                                <span className="icon is-small">
                                                    <Icon path={mdiCloseCircle} size={3}/>
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div> 
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
