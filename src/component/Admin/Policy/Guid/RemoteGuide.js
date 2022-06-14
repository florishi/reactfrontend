import Button from "@material-ui/core/Button";
import Collapse from "@material-ui/core/Collapse";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import Link from "@material-ui/core/Link";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import Stepper from "@material-ui/core/Stepper";
import { lighten, makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Alert from "@material-ui/lab/Alert";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { toggleSnackbar } from "../../../../redux/explorer";
import API from "../../../../middleware/Api";
import { getNumber, randomStr } from "../../../../utils";
import DomainInput from "../../Common/DomainInput";
import SizeInput from "../../Common/SizeInput";
import MagicVar from "../../Dialogs/MagicVar";
import { Trans, useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
    stepContent: {
        padding: "16px 32px 16px 32px",
    },
    form: {
        maxWidth: 400,
        marginTop: 20,
    },
    formContainer: {
        [theme.breakpoints.up("md")]: {
            padding: "0px 24px 0 24px",
        },
    },
    subStepContainer: {
        display: "flex",
        marginBottom: 20,
        padding: 10,
        transition: theme.transitions.create("background-color", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        "&:focus-within": {
            backgroundColor: theme.palette.background.default,
        },
    },
    stepNumber: {
        width: 20,
        height: 20,
        backgroundColor: lighten(theme.palette.secondary.light, 0.2),
        color: theme.palette.secondary.contrastText,
        textAlign: "center",
        borderRadius: " 50%",
    },
    stepNumberContainer: {
        marginRight: 10,
    },
    stepFooter: {
        marginTop: 32,
    },
    button: {
        marginRight: theme.spacing(1),
    },
    "@global": {
        code: {
            color: "rgba(0, 0, 0, 0.87)",
            display: "inline-block",
            padding: "2px 6px",
            fontSize: "14px",
            fontFamily:
                ' Consolas, "Liberation Mono", Menlo, Courier, monospace',
            borderRadius: "2px",
            backgroundColor: "rgba(255,229,100,0.1)",
        },
        pre: {
            margin: "24px 0",
            padding: "12px 18px",
            overflow: "auto",
            direction: "ltr",
            borderRadius: "4px",
            backgroundColor: "#272c34",
            color: "#fff",
        },
    },
}));

const steps = [
    {
        title: "storageNode",
        optional: false,
    },
    {
        title: "storagePathStep",
        optional: false,
    },
    {
        title: "sourceLinkStep",
        optional: false,
    },
    {
        title: "uploadSettingStep",
        optional: false,
    },
    {
        title: "finishStep",
        optional: false,
    },
];

export default function RemoteGuide(props) {
    const { t } = useTranslation("dashboard", { keyPrefix: "policy" });
    const classes = useStyles();
    const history = useHistory();

    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [skipped] = React.useState(new Set());
    const [magicVar, setMagicVar] = useState("");
    const [useCDN, setUseCDN] = useState("false");
    const [policy, setPolicy] = useState(
        props.policy
            ? props.policy
            : {
                  Type: "remote",
                  Name: "",
                  Server: "https://example.com:5212",
                  SecretKey: randomStr(64),
                  DirNameRule: "uploads/{year}/{month}/{day}",
                  AutoRename: "true",
                  FileNameRule: "{randomkey8}_{originname}",
                  IsOriginLinkEnable: "false",
                  BaseURL: "",
                  IsPrivate: "true",
                  MaxSize: "0",
                  OptionsSerialized: {
                      file_type: "",
                      chunk_size: 25 << 20,
                  },
              }
    );

    const handleChange = (name) => (event) => {
        setPolicy({
            ...policy,
            [name]: event.target.value,
        });
    };

    const handleOptionChange = (name) => (event) => {
        setPolicy({
            ...policy,
            OptionsSerialized: {
                ...policy.OptionsSerialized,
                [name]: event.target.value,
            },
        });
    };

    const isStepSkipped = (step) => {
        return skipped.has(step);
    };

    const dispatch = useDispatch();
    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );

    const testSlave = () => {
        setLoading(true);

        // 测试路径是否可用
        API.post("/admin/policy/test/slave", {
            server: policy.Server,
            secret: policy.SecretKey,
        })
            .then(() => {
                ToggleSnackbar("top", "right", t("communicationOK"), "success");
            })
            .catch((error) => {
                ToggleSnackbar("top", "right", error.message, "error");
            })
            .then(() => {
                setLoading(false);
            });
    };

    const submitPolicy = (e) => {
        e.preventDefault();
        setLoading(true);

        const policyCopy = { ...policy };
        policyCopy.OptionsSerialized = { ...policyCopy.OptionsSerialized };

        // 处理存储策略
        if (useCDN === "false" || policy.IsOriginLinkEnable === "false") {
            policyCopy.BaseURL = "";
        }

        // 类型转换
        policyCopy.AutoRename = policyCopy.AutoRename === "true";
        policyCopy.IsOriginLinkEnable =
            policyCopy.IsOriginLinkEnable === "true";
        policyCopy.MaxSize = parseInt(policyCopy.MaxSize);
        policyCopy.OptionsSerialized.chunk_size = parseInt(
            policyCopy.OptionsSerialized.chunk_size
        );
        policyCopy.OptionsSerialized.placeholder_with_size =
            policyCopy.OptionsSerialized.placeholder_with_size === "true";
        policyCopy.IsPrivate = policyCopy.IsPrivate === "true";
        policyCopy.OptionsSerialized.file_type = policyCopy.OptionsSerialized.file_type.split(
            ","
        );
        if (
            policyCopy.OptionsSerialized.file_type.length === 1 &&
            policyCopy.OptionsSerialized.file_type[0] === ""
        ) {
            policyCopy.OptionsSerialized.file_type = [];
        }

        API.post("/admin/policy", {
            policy: policyCopy,
        })
            .then(() => {
                ToggleSnackbar(
                    "top",
                    "right",
                    props.policy ? t("policySaved") : t("policyAdded"),
                    "success"
                );
                setActiveStep(5);
            })
            .catch((error) => {
                ToggleSnackbar("top", "right", error.message, "error");
            })
            .then(() => {
                setLoading(false);
            });

        setLoading(false);
    };

    return (
        <div>
            <Typography variant={"h6"}>
                {props.policy
                    ? t("editRemoteStoragePolicy")
                    : t("addRemoteStoragePolicy")}
            </Typography>
            <Stepper activeStep={activeStep}>
                {steps.map((label, index) => {
                    const stepProps = {};
                    const labelProps = {};
                    if (label.optional) {
                        labelProps.optional = (
                            <Typography variant="caption">
                                {t("optional")}
                            </Typography>
                        );
                    }
                    if (isStepSkipped(index)) {
                        stepProps.completed = false;
                    }
                    return (
                        <Step key={label.title} {...stepProps}>
                            <StepLabel {...labelProps}>
                                {t(label.title)}
                            </StepLabel>
                        </Step>
                    );
                })}
            </Stepper>

            {activeStep === 0 && (
                <form
                    className={classes.stepContent}
                    onSubmit={(e) => {
                        e.preventDefault();
                        setActiveStep(1);
                    }}
                >
                    <Alert severity="info" style={{ marginBottom: 10 }}>
                        {t("remoteDescription")}
                    </Alert>

                    <div className={classes.subStepContainer}>
                        <div className={classes.stepNumberContainer}>
                            <div className={classes.stepNumber}>1</div>
                        </div>
                        <div className={classes.subStepContent}>
                            <Typography variant={"body2"}>
                                {t("remoteCopyBinaryDescription")}
                            </Typography>
                        </div>
                    </div>

                    <div className={classes.subStepContainer}>
                        <div className={classes.stepNumberContainer}>
                            <div className={classes.stepNumber}>2</div>
                        </div>
                        <div className={classes.subStepContent}>
                            <Typography variant={"body2"}>
                                {t("remoteSecretDescription")}
                            </Typography>
                            <div className={classes.form}>
                                <FormControl fullWidth>
                                    <InputLabel htmlFor="component-helper">
                                        {t("remoteSecret")}
                                    </InputLabel>
                                    <Input
                                        required
                                        inputProps={{
                                            minlength: 64,
                                        }}
                                        value={policy.SecretKey}
                                        onChange={handleChange("SecretKey")}
                                    />
                                </FormControl>
                            </div>
                        </div>
                    </div>

                    <div className={classes.subStepContainer}>
                        <div className={classes.stepNumberContainer}>
                            <div className={classes.stepNumber}>3</div>
                        </div>
                        <div className={classes.subStepContent}>
                            <Typography variant={"body2"}>
                                {t("modifyRemoteConfig")}
                                <br />
                                <Trans
                                    ns={"dashboard"}
                                    i18nKey={"policy.addRemoteConfigDes"}
                                    components={[<code key={0} />]}
                                />
                            </Typography>
                            <pre>
                                [System]
                                <br />
                                Mode = slave
                                <br />
                                Listen = :5212
                                <br />
                                <br />
                                [Slave]
                                <br />
                                Secret = {policy.SecretKey}
                                <br />
                                <br />
                                [CORS]
                                <br />
                                AllowOrigins = *<br />
                                AllowMethods = OPTIONS,GET,POST
                                <br />
                                AllowHeaders = *<br />
                            </pre>
                            <Typography variant={"body2"}>
                                {t("remoteConfigDifference")}
                                <ul>
                                    <li>
                                        <Trans
                                            ns={"dashboard"}
                                            i18nKey={
                                                "policy.remoteConfigDifference1"
                                            }
                                            components={[
                                                <code key={0} />,
                                                <code key={1} />,
                                                <code key={2} />,
                                            ]}
                                        />
                                    </li>
                                    <li>
                                        <Trans
                                            ns={"dashboard"}
                                            i18nKey={
                                                "policy.remoteConfigDifference2"
                                            }
                                            components={[
                                                <code key={0} />,
                                                <code key={1} />,
                                            ]}
                                        />
                                    </li>
                                    <li>
                                        <Trans
                                            ns={"dashboard"}
                                            i18nKey={
                                                "policy.remoteConfigDifference3"
                                            }
                                            components={[<code key={0} />]}
                                        />
                                    </li>
                                </ul>
                            </Typography>
                        </div>
                    </div>

                    <div className={classes.subStepContainer}>
                        <div className={classes.stepNumberContainer}>
                            <div className={classes.stepNumber}>4</div>
                        </div>
                        <div className={classes.subStepContent}>
                            <Typography variant={"body2"}>
                                {t("inputRemoteAddress")}
                                <br />
                                {t("inputRemoteAddressDes")}
                            </Typography>
                            <div className={classes.form}>
                                <FormControl fullWidth>
                                    <InputLabel htmlFor="component-helper">
                                        {t("remoteAddress")}
                                    </InputLabel>
                                    <Input
                                        fullWidth
                                        required
                                        type={"url"}
                                        value={policy.Server}
                                        onChange={handleChange("Server")}
                                    />
                                </FormControl>
                            </div>
                        </div>
                    </div>

                    <div className={classes.subStepContainer}>
                        <div className={classes.stepNumberContainer}>
                            <div className={classes.stepNumber}>5</div>
                        </div>
                        <div className={classes.subStepContent}>
                            <Typography variant={"body2"}>
                                {t("testCommunicationDes")}
                            </Typography>
                            <div className={classes.form}>
                                <Button
                                    disabled={loading}
                                    onClick={() => testSlave()}
                                    variant={"outlined"}
                                    color={"primary"}
                                >
                                    {t("testCommunication")}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className={classes.stepFooter}>
                        <Button
                            disabled={loading}
                            type={"submit"}
                            variant={"contained"}
                            color={"primary"}
                        >
                            {t("next")}
                        </Button>
                    </div>
                </form>
            )}

            {activeStep === 1 && (
                <form
                    className={classes.stepContent}
                    onSubmit={(e) => {
                        e.preventDefault();
                        setActiveStep(2);
                    }}
                >
                    <div className={classes.subStepContainer}>
                        <div className={classes.stepNumberContainer}>
                            <div className={classes.stepNumber}>1</div>
                        </div>
                        <div className={classes.subStepContent}>
                            <Typography variant={"body2"}>
                                <Trans
                                    ns={"dashboard"}
                                    i18nKey={"policy.filePathMagicVarDes"}
                                    components={[
                                        <Link
                                            key={0}
                                            color={"secondary"}
                                            href={"javascript:void()"}
                                            onClick={() => setMagicVar("file")}
                                        />,
                                    ]}
                                />
                            </Typography>
                            <div className={classes.form}>
                                <FormControl fullWidth>
                                    <InputLabel htmlFor="component-helper">
                                        {t("pathOfFolderToStoreFiles")}
                                    </InputLabel>
                                    <Input
                                        required
                                        value={policy.DirNameRule}
                                        onChange={handleChange("DirNameRule")}
                                    />
                                </FormControl>
                            </div>
                        </div>
                    </div>

                    <div className={classes.subStepContainer}>
                        <div className={classes.stepNumberContainer}>
                            <div className={classes.stepNumber}>2</div>
                        </div>
                        <div className={classes.subStepContent}>
                            <Typography variant={"body2"}>
                                是否需要对存储的物理文件进行重命名？此处的重命名不会影响最终呈现给用户的
                                文件名。文件名也可使用魔法变量，
                                可用魔法变量可参考{" "}
                                <Link
                                    color={"secondary"}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setMagicVar("file");
                                    }}
                                >
                                    文件名魔法变量列表
                                </Link>{" "}
                                。
                            </Typography>
                            <div className={classes.form}>
                                <FormControl required component="fieldset">
                                    <RadioGroup
                                        aria-label="gender"
                                        name="gender1"
                                        value={policy.AutoRename}
                                        onChange={handleChange("AutoRename")}
                                        row
                                    >
                                        <FormControlLabel
                                            value={"true"}
                                            control={
                                                <Radio color={"primary"} />
                                            }
                                            label={t("autoRenameStoredFile")}
                                        />
                                        <FormControlLabel
                                            value={"false"}
                                            control={
                                                <Radio color={"primary"} />
                                            }
                                            label={t("keepOriginalFileName")}
                                        />
                                    </RadioGroup>
                                </FormControl>
                            </div>

                            <Collapse in={policy.AutoRename === "true"}>
                                <div className={classes.form}>
                                    <FormControl fullWidth>
                                        <InputLabel htmlFor="component-helper">
                                            {t("renameRule")}
                                        </InputLabel>
                                        <Input
                                            required={
                                                policy.AutoRename === "true"
                                            }
                                            value={policy.FileNameRule}
                                            onChange={handleChange(
                                                "FileNameRule"
                                            )}
                                        />
                                    </FormControl>
                                </div>
                            </Collapse>
                        </div>
                    </div>

                    <div className={classes.stepFooter}>
                        <Button
                            color={"default"}
                            className={classes.button}
                            onClick={() => setActiveStep(0)}
                        >
                            {t("back")}
                        </Button>
                        <Button
                            disabled={loading}
                            type={"submit"}
                            variant={"contained"}
                            color={"primary"}
                        >
                            {t("next")}
                        </Button>
                    </div>
                </form>
            )}

            {activeStep === 2 && (
                <form
                    className={classes.stepContent}
                    onSubmit={(e) => {
                        e.preventDefault();
                        setActiveStep(3);
                    }}
                >
                    <div className={classes.subStepContainer}>
                        <div className={classes.stepNumberContainer}>
                            <div className={classes.stepNumber}>1</div>
                        </div>
                        <div className={classes.subStepContent}>
                            <Typography variant={"body2"}>
                                {t("enableGettingPermanentSourceLink")}
                                <br />
                                {t("enableGettingPermanentSourceLinkDes")}
                            </Typography>

                            <div className={classes.form}>
                                <FormControl required component="fieldset">
                                    <RadioGroup
                                        required
                                        value={policy.IsOriginLinkEnable}
                                        onChange={handleChange(
                                            "IsOriginLinkEnable"
                                        )}
                                        row
                                    >
                                        <FormControlLabel
                                            value={"true"}
                                            control={
                                                <Radio color={"primary"} />
                                            }
                                            label={t("allowed")}
                                        />
                                        <FormControlLabel
                                            value={"false"}
                                            control={
                                                <Radio color={"primary"} />
                                            }
                                            label={t("forbidden")}
                                        />
                                    </RadioGroup>
                                </FormControl>
                            </div>
                        </div>
                    </div>

                    <Collapse in={policy.IsOriginLinkEnable === "true"}>
                        <div className={classes.subStepContainer}>
                            <div className={classes.stepNumberContainer}>
                                <div className={classes.stepNumber}>2</div>
                            </div>
                            <div className={classes.subStepContent}>
                                <Typography variant={"body2"}>
                                    {t("useCDN")}
                                    <br />
                                    {t("useCDNDes")}
                                </Typography>

                                <div className={classes.form}>
                                    <FormControl required component="fieldset">
                                        <RadioGroup
                                            required
                                            value={useCDN}
                                            onChange={(e) => {
                                                if (
                                                    e.target.value === "false"
                                                ) {
                                                    setPolicy({
                                                        ...policy,
                                                        BaseURL: "",
                                                    });
                                                }
                                                setUseCDN(e.target.value);
                                            }}
                                            row
                                        >
                                            <FormControlLabel
                                                value={"true"}
                                                control={
                                                    <Radio color={"primary"} />
                                                }
                                                label={t("use")}
                                            />
                                            <FormControlLabel
                                                value={"false"}
                                                control={
                                                    <Radio color={"primary"} />
                                                }
                                                label={t("notUse")}
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                </div>
                            </div>
                        </div>

                        <Collapse in={useCDN === "true"}>
                            <div className={classes.subStepContainer}>
                                <div className={classes.stepNumberContainer}>
                                    <div className={classes.stepNumber}>3</div>
                                </div>
                                <div className={classes.subStepContent}>
                                    <Typography variant={"body2"}>
                                        {t("cdnDomain")}
                                    </Typography>

                                    <div className={classes.form}>
                                        <DomainInput
                                            value={policy.BaseURL}
                                            onChange={handleChange("BaseURL")}
                                            required={
                                                policy.IsOriginLinkEnable ===
                                                    "true" && useCDN === "true"
                                            }
                                            label={t("cdnPrefix")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Collapse>
                    </Collapse>

                    <div className={classes.stepFooter}>
                        <Button
                            color={"default"}
                            className={classes.button}
                            onClick={() => setActiveStep(1)}
                        >
                            {t("back")}
                        </Button>{" "}
                        <Button
                            disabled={loading}
                            type={"submit"}
                            variant={"contained"}
                            color={"primary"}
                        >
                            {t("next")}
                        </Button>
                    </div>
                </form>
            )}

            {activeStep === 3 && (
                <form
                    className={classes.stepContent}
                    onSubmit={(e) => {
                        e.preventDefault();
                        setActiveStep(4);
                    }}
                >
                    <div className={classes.subStepContainer}>
                        <div className={classes.stepNumberContainer}>
                            <div className={classes.stepNumber}>1</div>
                        </div>
                        <div className={classes.subStepContent}>
                            <Typography variant={"body2"}>
                                {t("limitFileSize")}
                            </Typography>

                            <div className={classes.form}>
                                <FormControl required component="fieldset">
                                    <RadioGroup
                                        required
                                        value={
                                            policy.MaxSize === "0"
                                                ? "false"
                                                : "true"
                                        }
                                        onChange={(e) => {
                                            if (e.target.value === "true") {
                                                setPolicy({
                                                    ...policy,
                                                    MaxSize: "10485760",
                                                });
                                            } else {
                                                setPolicy({
                                                    ...policy,
                                                    MaxSize: "0",
                                                });
                                            }
                                        }}
                                        row
                                    >
                                        <FormControlLabel
                                            value={"true"}
                                            control={
                                                <Radio color={"primary"} />
                                            }
                                            label={t("limit")}
                                        />
                                        <FormControlLabel
                                            value={"false"}
                                            control={
                                                <Radio color={"primary"} />
                                            }
                                            label={t("notLimit")}
                                        />
                                    </RadioGroup>
                                </FormControl>
                            </div>
                        </div>
                    </div>

                    <Collapse in={policy.MaxSize !== "0"}>
                        <div className={classes.subStepContainer}>
                            <div className={classes.stepNumberContainer}>
                                <div className={classes.stepNumber}>2</div>
                            </div>
                            <div className={classes.subStepContent}>
                                <Typography variant={"body2"}>
                                    {t("enterSizeLimit")}
                                </Typography>
                                <div className={classes.form}>
                                    <SizeInput
                                        value={policy.MaxSize}
                                        onChange={handleChange("MaxSize")}
                                        min={0}
                                        max={9223372036854775807}
                                        label={t("maxSizeOfSingleFile")}
                                    />
                                </div>
                            </div>
                        </div>
                    </Collapse>

                    <div className={classes.subStepContainer}>
                        <div className={classes.stepNumberContainer}>
                            <div className={classes.stepNumber}>
                                {policy.MaxSize !== "0" ? "3" : "2"}
                            </div>
                        </div>
                        <div className={classes.subStepContent}>
                            <Typography variant={"body2"}>
                                {t("limitFileExt")}
                            </Typography>

                            <div className={classes.form}>
                                <FormControl required component="fieldset">
                                    <RadioGroup
                                        required
                                        value={
                                            policy.OptionsSerialized
                                                .file_type === ""
                                                ? "false"
                                                : "true"
                                        }
                                        onChange={(e) => {
                                            if (e.target.value === "true") {
                                                setPolicy({
                                                    ...policy,
                                                    OptionsSerialized: {
                                                        ...policy.OptionsSerialized,
                                                        file_type:
                                                            "jpg,png,mp4,zip,rar",
                                                    },
                                                });
                                            } else {
                                                setPolicy({
                                                    ...policy,
                                                    OptionsSerialized: {
                                                        ...policy.OptionsSerialized,
                                                        file_type: "",
                                                    },
                                                });
                                            }
                                        }}
                                        row
                                    >
                                        <FormControlLabel
                                            value={"true"}
                                            control={
                                                <Radio color={"primary"} />
                                            }
                                            label={t("limit")}
                                        />
                                        <FormControlLabel
                                            value={"false"}
                                            control={
                                                <Radio color={"primary"} />
                                            }
                                            label={t("notLimit")}
                                        />
                                    </RadioGroup>
                                </FormControl>
                            </div>
                        </div>
                    </div>

                    <Collapse in={policy.OptionsSerialized.file_type !== ""}>
                        <div className={classes.subStepContainer}>
                            <div className={classes.stepNumberContainer}>
                                <div className={classes.stepNumber}>
                                    {policy.MaxSize !== "0" ? "4" : "3"}
                                </div>
                            </div>
                            <div className={classes.subStepContent}>
                                <Typography variant={"body2"}>
                                    {t("enterFileExt")}
                                </Typography>
                                <div className={classes.form}>
                                    <FormControl fullWidth>
                                        <InputLabel htmlFor="component-helper">
                                            {t("extList")}
                                        </InputLabel>
                                        <Input
                                            value={
                                                policy.OptionsSerialized
                                                    .file_type
                                            }
                                            onChange={handleOptionChange(
                                                "file_type"
                                            )}
                                        />
                                    </FormControl>
                                </div>
                            </div>
                        </div>
                    </Collapse>

                    <div className={classes.subStepContainer}>
                        <div className={classes.stepNumberContainer}>
                            <div className={classes.stepNumber}>
                                {getNumber(3, [
                                    policy.MaxSize !== "0",
                                    policy.OptionsSerialized.file_type !== "",
                                ])}
                            </div>
                        </div>
                        <div className={classes.subStepContent}>
                            <Typography variant={"body2"}>
                                {t("chunkSizeLabel")}
                                <br />
                                {t("chunkSizeDes")}
                            </Typography>
                            <div className={classes.form}>
                                <SizeInput
                                    value={policy.OptionsSerialized.chunk_size}
                                    onChange={handleOptionChange("chunk_size")}
                                    min={0}
                                    max={9223372036854775807}
                                    label={t("chunkSize")}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={classes.stepFooter}>
                        <Button
                            color={"default"}
                            className={classes.button}
                            onClick={() => setActiveStep(2)}
                        >
                            {t("back")}
                        </Button>{" "}
                        <Button
                            disabled={loading}
                            type={"submit"}
                            variant={"contained"}
                            color={"primary"}
                        >
                            {t("next")}
                        </Button>
                    </div>
                </form>
            )}

            {activeStep === 4 && (
                <form className={classes.stepContent} onSubmit={submitPolicy}>
                    <div className={classes.subStepContainer}>
                        <div className={classes.stepNumberContainer}></div>
                        <div className={classes.subStepContent}>
                            <Typography variant={"body2"}>
                                {t("nameThePolicy")}
                            </Typography>
                            <div className={classes.form}>
                                <FormControl fullWidth>
                                    <InputLabel htmlFor="component-helper">
                                        {t("policyName")}
                                    </InputLabel>
                                    <Input
                                        required
                                        value={policy.Name}
                                        onChange={handleChange("Name")}
                                    />
                                </FormControl>
                            </div>
                        </div>
                    </div>
                    <div className={classes.stepFooter}>
                        <Button
                            color={"default"}
                            className={classes.button}
                            onClick={() => setActiveStep(3)}
                        >
                            {t("back")}
                        </Button>{" "}
                        <Button
                            disabled={loading}
                            type={"submit"}
                            variant={"contained"}
                            color={"primary"}
                        >
                            {t("finish")}
                        </Button>
                    </div>
                </form>
            )}

            {activeStep === 5 && (
                <>
                    <form className={classes.stepContent}>
                        <Typography>
                            {props.policy ? t("policySaved") : t("policyAdded")}
                        </Typography>
                        <Typography variant={"body2"} color={"textSecondary"}>
                            {t("furtherActions")}
                        </Typography>
                    </form>
                    <div className={classes.stepFooter}>
                        <Button
                            color={"primary"}
                            className={classes.button}
                            onClick={() => history.push("/admin/policy")}
                        >
                            {t("backToList")}
                        </Button>
                    </div>
                </>
            )}

            <MagicVar
                open={magicVar === "file"}
                isFile
                isSlave
                onClose={() => setMagicVar("")}
            />
            <MagicVar
                open={magicVar === "path"}
                isSlave
                onClose={() => setMagicVar("")}
            />
        </div>
    );
}
