import React, { useCallback, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import NodeGuide from "./Guide/NodeGuide";
import { useParams } from "react-router";
import { useDispatch } from "react-redux";
import { toggleSnackbar } from "../../../actions";
import API from "../../../middleware/Api";

const useStyles = makeStyles((theme) => ({
    root: {
        [theme.breakpoints.up("md")]: {
            marginLeft: 100,
        },
        marginBottom: 40,
    },
    content: {
        padding: theme.spacing(2),
    },
}));

export default function EditNode() {
    const classes = useStyles();
    const { id } = useParams();
    const [node, setNode] = useState(null);

    const dispatch = useDispatch();
    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );

    useEffect(() => {
        API.get("/admin/node/" + id)
            .then((response) => {
                response.data.Rank = response.data.Rank.toString();
                response.data.Aria2Enabled = response.data.Aria2Enabled
                    ? "true"
                    : "false";
                setNode(response.data);
            })
            .catch((error) => {
                ToggleSnackbar("top", "right", error.message, "error");
            });
    }, [id]);

    return (
        <div>
            <Paper square className={classes.content}>
                {node && <NodeGuide node={node} />}
            </Paper>
        </div>
    );
}
