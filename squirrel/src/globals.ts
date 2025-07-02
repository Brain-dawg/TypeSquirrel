import keywordsArray from './data/keywords.json';
import stringCompletionsArray from './data/stringCompletions.json';
import docs from "./data/docs.json";
import { StringKind, Doc, Docs, InstanceDocs } from './squirrel';

export const keywords = new Set<string>(keywordsArray);


export const stringCompletions: Set<string>[] = stringCompletionsArray.map(
	(arr: string[]) => new Set<string>(arr)
);

// It's possible to set any sort of keyvalue as a string
for (const keyvalue of [StringKind.NUMBER_KEYVALUE, StringKind.VECTOR_KEYVALUE]) {
	for (const item of stringCompletions[keyvalue]) {
		stringCompletions[StringKind.STRING_KEYVALUE].add(item);
	}
}

stringCompletions[StringKind.ARRAY_PROPERTY] = new Set([
	...stringCompletions[StringKind.INT_ARRAY_PROPERTY],
	...stringCompletions[StringKind.BOOL_ARRAY_PROPERTY],
	...stringCompletions[StringKind.FLOAT_ARRAY_PROPERTY],
	...stringCompletions[StringKind.STRING_ARRAY_PROPERTY],
	...stringCompletions[StringKind.ENTITY_ARRAY_PROPERTY],
	...stringCompletions[StringKind.VECTOR_ARRAY_PROPERTY]
]);

stringCompletions[StringKind.PROPERTY] = new Set([
	...stringCompletions[StringKind.INT_PROPERTY],
	...stringCompletions[StringKind.BOOL_PROPERTY],
	...stringCompletions[StringKind.FLOAT_PROPERTY],
	...stringCompletions[StringKind.STRING_PROPERTY],
	...stringCompletions[StringKind.ENTITY_PROPERTY],
	...stringCompletions[StringKind.VECTOR_PROPERTY],

	...stringCompletions[StringKind.ARRAY_PROPERTY]
]);

stringCompletions[StringKind.SOUND] = new Set([
	...stringCompletions[StringKind.RAW_SOUND],
	...stringCompletions[StringKind.SOUND_SCRIPT]
]);

/*
// It's possible to set bools as ints
for (const item of stringCompletions[StringParam.BOOL_PROPERTY]) {
	stringCompletions[StringParam.INT_PROPERTY].add(item);
}*/


function reviveDoc(doc: any): Doc {
	const newDoc: any = { ...doc };
	for (const key in newDoc) {
		if (
			!isNaN(Number(key)) &&
			typeof newDoc[key] === 'string' &&
			StringKind[newDoc[key] as keyof typeof StringKind] !== undefined
		) {
			newDoc[key] = StringKind[newDoc[key] as keyof typeof StringKind];
		}
	}
	return newDoc;
}

function loadDocs(obj: Record<string, any>): Docs {
	return new Map(
		Object.entries(obj).map(([name, doc]) => [name, reviveDoc(doc)])
	);
}

function loadInstanceDocs(obj: Record<string, Record<string, any>>): InstanceDocs {
	return new Map(
		Object.entries(obj).map(([instanceName, methodsObj]) => [
			instanceName,
			new Map(
				Object.entries(methodsObj).map(([methodName, doc]) => [
					methodName,
					reviveDoc(doc)
				])
			)
		])
	);
}

export const methods: Docs = loadDocs(docs.methods);
export const deprecatedMethods: Docs = loadDocs(docs.deprecatedMethods);
export const functions: Docs = loadDocs(docs.functions);
export const deprecatedFunctions: Docs = loadDocs(docs.deprecatedFunctions);
export const events: Docs = loadDocs(docs.events);
export const builtInConstants: Docs = loadDocs(docs.constants);
export const builtInVariables: Docs = loadDocs(docs.variables);



export const instancesMethods: InstanceDocs = loadInstanceDocs(docs.instancesMethods);
export const instancesVariables: InstanceDocs = loadInstanceDocs(docs.instancesVariables);

export const otherMethods: Docs = new Map();
export const otherVariables: Docs = new Map();
// Combine instances methods/constants into a single one
for (const [instanceName, innerMap] of instancesVariables) {
	// hardcode 
	let append = "Constants.";
	if (instanceName === "Constants") {
		append = '';
	}

	for (const [name, doc] of innerMap) {
		otherVariables.set(name, {
			...doc,
			append: append + instanceName + '.'
		});
	}
}

for (const [instanceName, innerMap] of instancesMethods) {
	for (const [name, doc] of innerMap) {
		otherMethods.set(name, {
			...doc,
			append: instanceName + '.'
		});
	}
}



export const docSnippets: Docs = loadDocs(docs.JSDocs);

const synonyms: [string, string][] = [
	["virtual", "abstract"],
	["extends", "augments"],
	["constructor", "class"],
	["const", "constant"],
	["defaultvalue", "default"],
	["desc", "description"],
	["host", "external"],
	["fileoverview", "file"],
	["overview", "file"],
	["emits", "fires"],
	["func", "function"],
	["method", "function"],
	["var", "function"],
	["arg", "param"],
	["argument", "param"],
	["prop", "property"],
	["return", "returns"],
	["exception", "throws"]
];

synonyms.forEach(([synonym, original]) => {
	if (!docSnippets.has(synonym)) {
		docSnippets.set(synonym, docSnippets.get(original)!);
	}
});