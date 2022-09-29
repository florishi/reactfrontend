import { lighten } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import IconButton from "@material-ui/core/IconButton";
import Link from "@material-ui/core/Link";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Toolbar from "@material-ui/core/Toolbar";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { Delete } from "@material-ui/icons";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toggleSnackbar } from "../../../redux/explorer";
import API from "../../../middleware/Api";
import { sizeToString } from "../../../utils";
import ShareFilter from "../Dialogs/ShareFilter";
import { formatLocalTime } from "../../../utils/datetime";
import Aria2Helper from "./Aria2Helper";
import HelpIcon from "@material-ui/icons/Help";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
    container: {
        overflowX: "auto",
    },
    tableContainer: {
        marginTop: 16,
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
    },
    headerRight: {},
    highlight:
        theme.palette.type === "light"
            ? {
                  color: theme.palette.secondary.main,
                  backgroundColor: lighten(theme.palette.secondary.light, 0.85),
              }
            : {
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.secondary.dark,
              },
    visuallyHidden: {
        border: 0,
        clip: "rect(0 0 0 0)",
        height: 1,
        margin: -1,
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        top: 20,
        width: 1,
    },
}));

export default function Download() {
    const { t } = useTranslation("dashboard", { keyPrefix: "task" });
    const { t: tDashboard } = useTranslation("dashboard");
    const classes = useStyles();
    const [downloads, setDownloads] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState({});
    const [users, setUsers] = useState({});
    const [search, setSearch] = useState({});
    const [orderBy, setOrderBy] = useState(["id", "desc"]);
    const [filterDialog, setFilterDialog] = useState(false);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);
    const [helperOpen, setHelperOpen] = useState(false);

    const dispatch = useDispatch();
    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );

    const loadList = () => {
        API.post("/admin/download/list", {
            page: page,
            page_size: pageSize,
            order_by: orderBy.join(" "),
            conditions: filter,
            searches: search,
        })
            .then((response) => {
                setUsers(response.data.users);
                setDownloads(response.data.items);
                setTotal(response.data.total);
                setSelected([]);
            })
            .catch((error) => {
                ToggleSnackbar("top", "right", error.message, "error");
            });
    };

    useEffect(() => {
        loadList();
    }, [page, pageSize, orderBy, filter, search]);

    const deletePolicy = (id) => {
        setLoading(true);
        API.post("/admin/download/delete", { id: [id] })
            .then(() => {
                loadList();
                ToggleSnackbar("top", "right", t("taskDeleted"), "success");
            })
            .catch((error) => {
                ToggleSnackbar("top", "right", error.message, "error");
            })
            .then(() => {
                setLoading(false);
            });
    };

    const deleteBatch = () => {
        setLoading(true);
        API.post("/admin/download/delete", { id: selected })
            .then(() => {
                loadList();
                ToggleSnackbar("top", "right", t("taskDeleted"), "success");
            })
            .catch((error) => {
                ToggleSnackbar("top", "right", error.message, "error");
            })
            .then(() => {
                setLoading(false);
            });
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = downloads.map((n) => n.ID);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, name) => {
        const selectedIndex = selected.indexOf(name);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, name);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1)
            );
        }

        setSelected(newSelected);
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    return (
        <div>
            <Aria2Helper
                open={helperOpen}
                onClose={() => setHelperOpen(false)}
            />
            <ShareFilter
                filter={filter}
                open={filterDialog}
                onClose={() => setFilterDialog(false)}
                setSearch={setSearch}
                setFilter={setFilter}
            />
            <div className={classes.header}>
                <Button
                    color={"primary"}
                    onClick={() => loadList()}
                    variant={"outlined"}
                >
                    {tDashboard("policy.refresh")}
                </Button>
                <div className={classes.headerRight}>
                    <Button
                        color={"primary"}
                        onClick={() => setHelperOpen(true)}
                    >
                        <HelpIcon /> {"  "}
                        {t("howToConfigAria2")}
                    </Button>
                </div>
            </div>

            <Paper square className={classes.tableContainer}>
                {selected.length > 0 && (
                    <Toolbar className={classes.highlight}>
                        <Typography
                            style={{ flex: "1 1 100%" }}
                            color="inherit"
                            variant="subtitle1"
                        >
                            {tDashboard("user.selectedObjects", {
                                num: selected.length,
                            })}
                        </Typography>
                        <Tooltip title={tDashboard("policy.delete")}>
                            <IconButton
                                onClick={deleteBatch}
                                disabled={loading}
                                aria-label="delete"
                            >
                                <Delete />
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                )}
                <TableContainer className={classes.container}>
                    <Table aria-label="sticky table" size={"small"}>
                        <TableHead>
                            <TableRow style={{ height: 52 }}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={
                                            selected.length > 0 &&
                                            selected.length < downloads.length
                                        }
                                        checked={
                                            downloads.length > 0 &&
                                            selected.length === downloads.length
                                        }
                                        onChange={handleSelectAllClick}
                                        inputProps={{
                                            "aria-label": "select all desserts",
                                        }}
                                    />
                                </TableCell>
                                <TableCell style={{ minWidth: 10 }}>
                                    <TableSortLabel
                                        active={orderBy[0] === "id"}
                                        direction={orderBy[1]}
                                        onClick={() =>
                                            setOrderBy([
                                                "id",
                                                orderBy[1] === "asc"
                                                    ? "desc"
                                                    : "asc",
                                            ])
                                        }
                                    >
                                        #
                                        {orderBy[0] === "id" ? (
                                            <span
                                                className={
                                                    classes.visuallyHidden
                                                }
                                            >
                                                {orderBy[1] === "desc"
                                                    ? "sorted descending"
                                                    : "sorted ascending"}
                                            </span>
                                        ) : null}
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell style={{ minWidth: 130 }}>
                                    {t("srcURL")}
                                </TableCell>
                                <TableCell style={{ minWidth: 90 }}>
                                    {tDashboard("user.status")}
                                </TableCell>
                                <TableCell style={{ minWidth: 90 }}>
                                    {t("node")}
                                </TableCell>
                                <TableCell
                                    style={{ minWidth: 150 }}
                                    align={"right"}
                                >
                                    <TableSortLabel
                                        active={orderBy[0] === "total_size"}
                                        direction={orderBy[1]}
                                        onClick={() =>
                                            setOrderBy([
                                                "total_size",
                                                orderBy[1] === "asc"
                                                    ? "desc"
                                                    : "asc",
                                            ])
                                        }
                                    >
                                        {tDashboard("file.size")}
                                        {orderBy[0] === "total_size" ? (
                                            <span
                                                className={
                                                    classes.visuallyHidden
                                                }
                                            >
                                                {orderBy[1] === "desc"
                                                    ? "sorted descending"
                                                    : "sorted ascending"}
                                            </span>
                                        ) : null}
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell style={{ minWidth: 100 }}>
                                    {t("createdBy")}
                                </TableCell>
                                <TableCell style={{ minWidth: 150 }}>
                                    {tDashboard("file.createdAt")}
                                </TableCell>
                                <TableCell style={{ minWidth: 80 }}>
                                    {tDashboard("policy.actions")}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {downloads.map((row) => (
                                <TableRow
                                    hover
                                    key={row.ID}
                                    role="checkbox"
                                    selected={isSelected(row.ID)}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            onClick={(event) =>
                                                handleClick(event, row.ID)
                                            }
                                            checked={isSelected(row.ID)}
                                        />
                                    </TableCell>
                                    <TableCell>{row.ID}</TableCell>
                                    <TableCell
                                        style={{ wordBreak: "break-all" }}
                                    >
                                        {row.Source}
                                    </TableCell>
                                    <TableCell>
                                        {row.Status === 0 && t("ready")}
                                        {row.Status === 1 && t("downloading")}
                                        {row.Status === 2 && t("paused")}
                                        {row.Status === 3 && t("error")}
                                        {row.Status === 4 && t("finished")}
                                        {row.Status === 5 && t("canceled")}
                                        {row.Status === 6 && t("unknown")}
                                        {row.Status === 7 && t("seeding")}
                                    </TableCell>
                                    <TableCell>
                                        {row.NodeID <= 1 && (
                                            <Link
                                                component={RouterLink}
                                                to={"/admin/node/edit/1"}
                                            >
                                                {tDashboard("node.master")}
                                            </Link>
                                        )}
                                        {row.NodeID > 1 && (
                                            <Link
                                                component={RouterLink}
                                                to={
                                                    "/admin/node/edit/" +
                                                    row.NodeID
                                                }
                                            >
                                                {tDashboard("node.slave")}#
                                                {row.NodeID}
                                            </Link>
                                        )}
                                    </TableCell>
                                    <TableCell align={"right"}>
                                        {sizeToString(row.TotalSize)}
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={
                                                "/admin/user/edit/" + row.UserID
                                            }
                                        >
                                            {users[row.UserID]
                                                ? users[row.UserID].Nick
                                                : tDashboard(
                                                      "file.unknownUploader"
                                                  )}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {formatLocalTime(row.CreatedAt)}
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip
                                            title={tDashboard("policy.delete")}
                                        >
                                            <IconButton
                                                disabled={loading}
                                                onClick={() =>
                                                    deletePolicy(row.ID)
                                                }
                                                size={"small"}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={total}
                    rowsPerPage={pageSize}
                    page={page - 1}
                    onChangePage={(e, p) => setPage(p + 1)}
                    onChangeRowsPerPage={(e) => {
                        setPageSize(e.target.value);
                        setPage(1);
                    }}
                />
            </Paper>
        </div>
    );
}
