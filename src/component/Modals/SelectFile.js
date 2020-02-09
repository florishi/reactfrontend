import React, {useState, useCallback, useEffect} from "react";
import { makeStyles } from "@material-ui/core";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    DialogContentText,
    CircularProgress
} from "@material-ui/core";
import {
    toggleSnackbar,
    setModalsLoading,
    refreshFileList
} from "../../actions/index";
import PathSelector from "../FileManager/PathSelector";
import { useDispatch } from "react-redux";
import API from "../../middleware/Api";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import MenuItem from "@material-ui/core/MenuItem";

const useStyles = makeStyles(theme => ({
    contentFix: {
        padding: "10px 24px 0px 24px"
    },
    wrapper: {
        margin: theme.spacing(1),
        position: "relative"
    },
    buttonProgress: {
        color: theme.palette.secondary.light,
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12
    },
    content:{
        padding:0,
    }
}));

export default function SelectFileDialog(props) {
    const [files,setFiles] = useState(props.files);

    useEffect(()=>{
        setFiles(props.files);
    },[props.files]);

    const dispatch = useDispatch();
    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );

    const handleChange = index => event =>{
        let filesCopy = [...files];
        filesCopy.map((v,k)=>{
            if (v.index === index){
                filesCopy[k] = {...filesCopy[k],selected:event.target.checked ? "true" : "false"};
            }
        });
        setFiles(filesCopy);
    };

    const submit = e =>{
        let index = [];
        files.map(v=>{
            if(v.selected === "true"){
                index.push(parseInt(v.index));
            }
        });
        props.onSubmit(index);
    };

    const classes = useStyles();

    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">选择要下载的文件</DialogTitle>
            <DialogContent dividers={"paper"} className={classes.content}>
                {files.map((v, k) => {
                    return (
                        <MenuItem key={k}>
                        <FormGroup row>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        onChange={handleChange(v.index)}
                                        checked={v.selected === "true"}
                                        value="checkedA"
                                    />
                                }
                                label={v.path}
                            />
                        </FormGroup></MenuItem>
                    );
                })}
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose}>取消</Button>
                <div className={classes.wrapper}>
                    <Button color="primary" onClick={submit} disabled={props.modalsLoading}>
                        确定
                        {props.modalsLoading && (
                            <CircularProgress
                                size={24}
                                className={classes.buttonProgress}
                            />
                        )}
                    </Button>
                </div>
            </DialogActions>
        </Dialog>
    );
}
