import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { NCV_View, useNCV_ViewState } from "./NCV_View/NCV_View";

import "react-tabs/style/react-tabs.css";
import "./TabView.css";

export interface TabViewProps {
}

export function TabView(_props: TabViewProps) {
  const state1 = useNCV_ViewState();
  const state2 = useNCV_ViewState();

  return (
    <Tabs className="tab-view">
      <TabList>
        <Tab>Title 1</Tab>
        <Tab>Title 2</Tab>
      </TabList>

      <TabPanel selectedClassName="tab-view-panel">
        <NCV_View state={state1} />
      </TabPanel>
      <TabPanel selectedClassName="tab-view-panel">
        <NCV_View state={state2} />
      </TabPanel>
    </Tabs>
  );
}
