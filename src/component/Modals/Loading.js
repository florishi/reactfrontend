import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import DialogContent from "@material-ui/core/DialogContent";
import Dialog from "@material-ui/core/Dialog";
import DialogContentText from "@material-ui/core/DialogContentText";
import { blue } from "@material-ui/core/colors";
import {useSelector} from "react-redux";

const useStyles = makeStyles({
    avatar: {
        backgroundColor: blue[100],
        color: blue[600]
    },
    loadingContainer: {
        display: "flex"
    },
    loading: {
        marginTop: 10,
        marginLeft: 20
    }
});

export default function LoadingDialog(props) {
    const classes = useStyles();
    const open = useSelector(
        state => state.viewUpdate.modals.loading,
    );
    const text = useSelector(
        state => state.viewUpdate.modals.loadingText,
    );


    return (
        <Dialog aria-labelledby="simple-dialog-title" open={open}>
            <DialogContent>
                <DialogContentText className={classes.loadingContainer}>
                    <CircularProgress color="secondary" />
                    <div className={classes.loading}>
                        {text}
                    </div>
                </DialogContentText>
            </DialogContent>
        </Dialog>
    );
}

LoadingDialog.propTypes = {
    open: PropTypes.bool.isRequired
};
