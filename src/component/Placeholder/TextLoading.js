import React from "react";
import { Code } from "react-content-loader";
import { makeStyles, useTheme } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    loader: {
        width: "70%",
        padding: 40,
        [theme.breakpoints.down("md")]: {
            width: "100%",
            padding: 10,
        },
    },
}));

const MyLoader = (props) => (
    <Code
        backgroundColor={props.dark ? "#333" : "#f5f6f7"}
        foregroundColor={props.dark ? "#636363" : "#eee"}
        className={props.className}
    />
);

function TextLoading() {
    const theme = useTheme();
    const classes = useStyles();

    return (
        <div>
            <MyLoader
                dark={theme.palette.type === "dark"}
                className={classes.loader}
            />
        </div>
    );
}

export default TextLoading;
