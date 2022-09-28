import * as React from 'react';
import {Button, TextField} from "@mui/material";


interface ButtonTextfieldProps {
    tfLabel: string
    buttonText: string
    submitFunc: Function
}

const ButtonTextfield: React.FC<ButtonTextfieldProps> = ({ tfLabel, buttonText, submitFunc }) => {

    const [textInput, setTextInput] = React.useState<string>("");
    const [disabled, setDisabled] = React.useState<boolean>(true);


    const handleTextFieldChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        event.preventDefault();
        setTextInput(event.target.value);
        if (event.target.value?.trim().length == 0) {
            setDisabled(true);
        }
        else {
            setDisabled(false);
        }
    }

    const handleInput = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        submitFunc(textInput.trim());  // Use textFieldInput
        setTextInput('');
        setDisabled(true);
    }

    return (
        <div style={{ display: "inline-block", verticalAlign: "middle" }}>
            <TextField id="filled-basic" label={tfLabel} variant="filled"
                       onChange={(e) => handleTextFieldChange(e)}
                       value={textInput}
                       style={{ marginLeft: 5, width: "70%" }}
            />
            <Button
                variant="outlined"
                onClick={(e) => handleInput(e)}
                disabled={disabled}
                style={{ margin: 5, textTransform: "none", width: "15%", height: 40 }}
            >{buttonText}</Button>
      </div>
    );
}

export default ButtonTextfield;
