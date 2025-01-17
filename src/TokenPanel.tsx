import {
  Button,
  InputGroup,
  Intent,
  Spinner,
  SpinnerSize,
} from "@blueprintjs/core";
import axios from "axios";
import React, { useState } from "react";
import createBlock from "roamjs-components/writes/createBlock";
import getFirstChildTextByBlockUid from "roamjs-components/queries/getFirstChildTextByBlockUid";
import getFirstChildUidByBlockUid from "roamjs-components/queries/getFirstChildUidByBlockUid";
import getGraph from "roamjs-components/util/getGraph";
import updateBlock from "roamjs-components/writes/updateBlock";

const TokenPanel = ({
  uid,
  parentUid,
}: {
  uid?: string;
  parentUid: string;
}) => {
  const [token, setToken] = useState(
    uid ? getFirstChildTextByBlockUid(uid) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <InputGroup
        disabled
        value={token}
        onChange={() => {}}
        rightElement={
          <Button
            minimal
            icon={"clipboard"}
            onClick={() => navigator.clipboard.writeText(token)}
          />
        }
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
        }}
      >
        <Button
          intent={Intent.PRIMARY}
          text={"Generate Token"}
          onClick={async () => {
            setLoading(true);
            setError("");
            const tokenUid =
              uid ||
              await createBlock({
                node: { text: "token" },
                parentUid,
              });
            const oldToken = getFirstChildTextByBlockUid(tokenUid) || "";
            axios
              .put(
                `${process.env.API_URL}/smartblocks-token`,
                { graph: getGraph() },
                { headers: { Authorization: oldToken } }
              )
              .then((r) => {
                const oldUid = getFirstChildUidByBlockUid(tokenUid);
                if (oldUid) {
                  updateBlock({ uid: oldUid, text: r.data.token });
                } else {
                  createBlock({
                    node: { text: r.data.token },
                    parentUid: tokenUid,
                  });
                }
                setToken(r.data.token);
              })
              .catch((e) => setError(e.response?.data || e.message))
              .finally(() => setLoading(false));
          }}
        />
        {loading && <Spinner size={SpinnerSize.SMALL} />}
      </div>
      <div style={{ color: "darkred" }}>{error}</div>
    </>
  );
};

export default TokenPanel;
