import React from "react";
import Modal from "react-modal";
import { download } from "../helper";

interface ModalInterface {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  summary: string;
}

const SummaryModal: React.FC<ModalInterface> = ({ open, setOpen, summary }) => {
  return (
    <Modal
      className="z-20 fixed h-[40%] w-[50%] left-1/2 right-1/2 transform -translate-x-1/2 top-1/5 shadow-2xl rounded-2xl overflow-auto bg-zinc-200 dark:bg-gray-700 border-2 border-white"
      isOpen={open}
      onRequestClose={() => setOpen(false)}
      ariaHideApp={false}
    >
      <div className="bg-indigo-600 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Summary</h2>
            <span title="download" onClick={() => download("summary.txt", summary)} className="fa fa-arrow-circle-down text-xl text-white cursor-pointer"></span>
        </div>
        <i
          className="font-bold fa fa-close text-white hover:text-gray-400"
          onClick={() => setOpen(false)}
        />
      </div>
      <div className="mt-4">
        <span className="p-4 font-medium">{summary}</span>
      </div>
    </Modal>
  );
};

export default SummaryModal;
