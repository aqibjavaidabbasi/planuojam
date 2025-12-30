import React from "react";
import Button from "../custom/Button";
import { MdAttachFile } from "react-icons/md";
import { IoSendSharp } from "react-icons/io5";

type Props = {
  text: string;
  onTextChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  uploading: boolean;
  attachments: File[];
  attachmentPreviews: string[];
  onFilesSelected: (files: File[]) => void;
  onRemoveAttachment: (index: number) => void;
  placeholder: string;
  disabled?: boolean;
};

const Composer: React.FC<Props> = ({
  text,
  onTextChange,
  onSend,
  sending,
  uploading,
  attachments,
  attachmentPreviews,
  onFilesSelected,
  onRemoveAttachment,
  placeholder,
  disabled,
}) => {
  return (
    <div className="border-t p-2 sm:p-3 flex flex-col gap-2 sm:gap-3">
      {attachmentPreviews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachmentPreviews.map((src, idx) => {
            const f = attachments[idx];
            const isImg = !!f?.type && f.type.startsWith("image/");
            return (
              <div key={idx} className="relative">
                {isImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} className="h-16 w-16 object-cover rounded" alt="preview" />
                ) : (
                  <a href={src} target="_blank" rel="noreferrer noopener" className="h-16 px-2 sm:px-3 py-2 bg-gray-100 rounded flex items-center gap-1 sm:gap-2 text-xs text-gray-800 min-w-0">
                    <MdAttachFile size={16} className="flex-shrink-0" />
                    <span className="truncate" title={f?.name || "file"}>{f?.name || "file"}</span>
                  </a>
                )}
                <button
                  onClick={() => onRemoveAttachment(idx)}
                  className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full h-6 w-6 text-xs cursor-pointer transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/60"
                  aria-label="remove"
                  type="button"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-1 sm:gap-2">
        <input
          type="text"
          className="flex-1 border rounded-lg px-2 sm:px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
          placeholder={placeholder}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={disabled}
        />
        <label className="p-1 sm:p-2 rounded-md cursor-pointer bg-white hover:bg-gray-50 flex-shrink-0">
          <MdAttachFile size={18} className="sm:w-5 sm:h-5" />
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) {
                onFilesSelected(files);
                e.currentTarget.value = "";
              }
            }}
          />
        </label>
        <Button
          onClick={onSend}
          style="ghost"
          extraStyles="flex-shrink-0"
          disabled={(text.trim() === "" && attachments.length === 0) || sending || uploading || !!disabled}
        >
          <IoSendSharp size={18} className="sm:w-5 sm:h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Composer;
