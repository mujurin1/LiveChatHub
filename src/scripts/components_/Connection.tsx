import { css } from "@emotion/react";
import { Box, Tab, Tabs } from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";
import { dep } from "../service/dep";

/**
 * 放送に接続するためのビュー
 */
export function Connection() {
  const liveStore = dep.getLiveStore();

  const [selectId, setSelectId] = useState(0);

  const changeTab = useCallback((_: any, value: number) => {
    setSelectId(value);
  }, []);

  const liveTabs = useMemo(
    () =>
      liveStore.lives.map((live) => (
        <Tab key={live.livePlatformId} label={live.livePlatformName} />
      )),
    [liveStore.lives]
  );

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={selectId}
          onChange={changeTab}
          aria-label="basic tabs example"
        >
          {liveTabs}
        </Tabs>
      </Box>
      {liveStore.lives.map((live, i) => (
        <div
          key={live.livePlatformId}
          hidden={selectId !== i}
          css={css`
            padding: 16px 32px;
          `}
        >
          {live.views.connect()}
        </div>
      ))}
    </>
  );
}
