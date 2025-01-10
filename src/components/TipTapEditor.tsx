"use client";
import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import TipTapMenuBar from "./TipTapMenuBar";
import { Button } from "./ui/button";
import { useDebounce } from "@/lib/useDebounce";
import { useMutation } from "@tanstack/react-query";
import Text from "@tiptap/extension-text";
import axios from "axios";
import { NoteType } from "@/lib/db/schema";
import { useCompletion } from "ai/react";

type Props = { note: NoteType };

const TipTapEditor = ({ note }: Props) => {
    const [editorState, setEditorState] = React.useState(
        note.editorState || `<h1>${note.name}</h1>`
    );
    const { complete, completion } = useCompletion({
        api: "/api/completion",
    });
    const saveNote = useMutation({
        mutationFn: async () => {
            const response = await axios.post("/api/saveNote", {
                noteId: note.id,
                editorState,
            });
            return response.data;
        },
    });
    const customText = Text.extend({
        addKeyboardShortcuts() {
            return {
                "Shift-a": () => {
                    console.log("ai activated");
                    const prompt = this.editor.getText().split(" ").slice(-30).join(" ");
                    console.log("prompt", prompt);
                    complete(prompt);
                    return true;
                },
            };
        },
    });

    const editor = useEditor({
        autofocus: true,
        extensions: [StarterKit, customText],
        content: editorState,
        onUpdate: ({ editor }) => {
            setEditorState(editor.getHTML());
        },
    });

    React.useEffect(() => {
        if (!completion || !editor) return;

        const words = completion.split(' ');
        let index = 0;

        const insertNextWord = () => {
            if (index < words.length) {
                editor.commands.insertContent(words[index] + (index === words.length - 1 ? '' : ' '), {
                    parseOptions: {
                        preserveWhitespace: false,
                    }
                });
                index++;
                setTimeout(insertNextWord, 50); // Adjust this delay (in ms) to control typing speed
            }
        };

        insertNextWord();
    }, [completion, editor]);

    const debouncedEditorState = useDebounce(editorState, 500);
    React.useEffect(() => {
        // save to db
        if (debouncedEditorState === "") return;
        saveNote.mutate(undefined, {
            onSuccess: (data) => {
                console.log("success update!", data);
            },
            onError: (err) => {
                console.error(err);
            },
        });
    }, [debouncedEditorState]);
    return (
        <>
            <div className="flex">
                {editor && <TipTapMenuBar editor={editor} />}
                <Button disabled variant={"outline"}>
                    {saveNote.isPending ? "Saving..." : "Saved"}
                </Button>
            </div>

            <div className="prose prose-sm w-full mt-4">
                <EditorContent editor={editor} />
            </div>
            <div className="h-4"></div>
            <span className="text-sm">
                Tip: Press{" "}
                <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                    Shift + A
                </kbd>{" "}
                for AI autocomplete
            </span>
        </>
    );
};

export default TipTapEditor;