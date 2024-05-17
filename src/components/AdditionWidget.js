import React, { useState } from 'react';

function AdditionWidget(props) {
    const [number1, setNumber1] = useState('');
    const [number2, setNumber2] = useState('');
    const [sum, setSum] = useState(null);

    const handleNumber1Change = (e) => {
        setNumber1(e.target.value);
    };

    const handleNumber2Change = (e) => {
        setNumber2(e.target.value);
    };

    const calculateSum = () => {
        const num1 = parseFloat(number1);
        const num2 = parseFloat(number2);
        if (!isNaN(num1) && !isNaN(num2)) {
            setSum(num1 + num2);
        } else {
            setSum('Please enter valid numbers');
        }
    };

    return (
        <div>
            <h4>Addition Widget</h4>

            <input
                type="number"
                value={number1}
                onChange={handleNumber1Change}
                placeholder="Enter first number"
            />
            <br />
            <input
                type="number"
                value={number2}
                onChange={handleNumber2Change}
                placeholder="Enter second number"
            />
            <br />
            <button onClick={calculateSum}>Calculate Sum</button>

            {sum !== null && (
                <div>
                    <h4>Sum: {sum}</h4>
                </div>
            )}
        </div>
    );
}

export default AdditionWidget;