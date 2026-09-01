export enum OperationType {
	Replace = "replace",
	InsertBefore = "insertBefore",
	InsertAfter = "insertAfter",
	Delete = "delete",
}

export const isValidOperationType = (type: OperationType): boolean => {
	return Object.values(OperationType).includes(type);
};
