import type { InferIn, Schema } from "@typeschema/main";
import * as React from "react";
import {} from "react/experimental";
import type {} from "zod";
import type { HookActionStatus, HookCallbacks, HookResult } from "./hooks.types";

export const getActionStatus = <
	ServerError,
	S extends Schema | undefined,
	const BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
>({
	isIdle,
	isExecuting,
	result,
}: {
	isIdle: boolean;
	isExecuting: boolean;
	result: HookResult<ServerError, S, BAS, CVE, CBAVE, Data>;
}): HookActionStatus => {
	if (isIdle) {
		return "idle";
	} else if (isExecuting) {
		return "executing";
	} else if (
		typeof result.validationErrors !== "undefined" ||
		typeof result.bindArgsValidationErrors !== "undefined" ||
		typeof result.serverError !== "undefined" ||
		typeof result.fetchError !== "undefined"
	) {
		return "hasErrored";
	} else {
		return "hasSucceeded";
	}
};

export const getActionShorthandStatusObject = (status: HookActionStatus) => {
	return {
		isIdle: status === "idle",
		isExecuting: status === "executing",
		hasSucceeded: status === "hasSucceeded",
		hasErrored: status === "hasErrored",
	};
};

export const useActionCallbacks = <
	ServerError,
	S extends Schema | undefined,
	const BAS extends readonly Schema[],
	CVE,
	CBAVE,
	Data,
>({
	result,
	input,
	status,
	cb,
}: {
	result: HookResult<ServerError, S, BAS, CVE, CBAVE, Data>;
	input: S extends Schema ? InferIn<S> : undefined;
	status: HookActionStatus;
	cb?: HookCallbacks<ServerError, S, BAS, CVE, CBAVE, Data>;
}) => {
	const onExecuteRef = React.useRef(cb?.onExecute);
	const onSuccessRef = React.useRef(cb?.onSuccess);
	const onErrorRef = React.useRef(cb?.onError);
	const onSettledRef = React.useRef(cb?.onSettled);

	// Execute the callback when the action status changes.
	React.useEffect(() => {
		const onExecute = onExecuteRef.current;
		const onSuccess = onSuccessRef.current;
		const onError = onErrorRef.current;
		const onSettled = onSettledRef.current;

		const executeCallbacks = async () => {
			switch (status) {
				case "executing":
					await Promise.resolve(onExecute?.({ input }));
					break;
				case "hasSucceeded":
					await Promise.resolve(onSuccess?.({ data: result?.data, input }));
					await Promise.resolve(onSettled?.({ result, input }));
					break;
				case "hasErrored":
					await Promise.resolve(onError?.({ error: result, input }));
					await Promise.resolve(onSettled?.({ result, input }));
					break;
			}
		};

		executeCallbacks().catch(console.error);
	}, [status, result, input]);
};
