import { cloneDeep } from "lodash";
import ImageViewer from "../../../../components/ImageViewer";
import CsvOutputComponent from "../../../../components/csvOutputComponent";
import PdfViewer from "../../../../components/pdfViewer";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Textarea } from "../../../../components/ui/textarea";
import { PDFViewConstant } from "../../../../constants/constants";
import { InputOutput } from "../../../../constants/enums";
import useFlowStore from "../../../../stores/flowStore";
import { IOFieldViewProps } from "../../../../types/components";
import IOFileInput from "./components/FileInput";

export default function IOFieldView({
  type,
  fieldType,
  fieldId,
  left,
}: IOFieldViewProps): JSX.Element | undefined {
  const nodes = useFlowStore((state) => state.nodes);
  const setNode = useFlowStore((state) => state.setNode);
  const flowPool = useFlowStore((state) => state.flowPool);
  const node = nodes.find((node) => node.id === fieldId);
  const flowPoolNode = (flowPool[node!.id] ?? [])[
    (flowPool[node!.id]?.length ?? 1) - 1
  ];
  const handleChangeSelect = (e) => {
    if (node) {
      let newNode = cloneDeep(node);
      if (newNode.data.node.template.separator) {
        newNode.data.node.template.separator.value = e;
        setNode(newNode.id, newNode);
      }
    }
  };

  function handleOutputType() {
    if (!node) return <>"No node found!"</>;
    switch (type) {
      case InputOutput.INPUT:
        switch (fieldType) {
          case "TextInput":
            return (
              <Textarea
                className={`w-full custom-scroll ${
                  left ? " min-h-32" : " h-full"
                }`}
                placeholder={"Enter text..."}
                value={node.data.node!.template["input_value"].value}
                onChange={(e) => {
                  e.target.value;
                  if (node) {
                    let newNode = cloneDeep(node);
                    newNode.data.node!.template["input_value"].value =
                      e.target.value;
                    setNode(node.id, newNode);
                  }
                }}
              />
            );
          case "FileLoader":
            return (
              <IOFileInput
                field={node.data.node!.template["file_path"]["value"]}
                updateValue={(e) => {
                  if (node) {
                    let newNode = cloneDeep(node);
                    newNode.data.node!.template["file_path"].value = e;
                    setNode(node.id, newNode);
                  }
                }}
              />
            );

          default:
            return (
              <Textarea
                className={`w-full custom-scroll ${
                  left ? " min-h-32" : " h-full"
                }`}
                placeholder={"Enter text..."}
                value={node.data.node!.template["input_value"]}
                onChange={(e) => {
                  e.target.value;
                  if (node) {
                    let newNode = cloneDeep(node);
                    newNode.data.node!.template["input_value"].value =
                      e.target.value;
                    setNode(node.id, newNode);
                  }
                }}
              />
            );
        }
      case InputOutput.OUTPUT:
        switch (fieldType) {
          case "TextOutput":
            return (
              <Textarea
                className={`w-full custom-scroll ${
                  left ? " min-h-32" : " h-full"
                }`}
                placeholder={"Empty"}
                // update to real value on flowPool
                value={
                  (flowPool[node.id] ?? [])[
                    (flowPool[node.id]?.length ?? 1) - 1
                  ]?.params ?? ""
                }
                readOnly
              />
            );
          case "PDFOutput":
            return left ? (
              <div>{PDFViewConstant}</div>
            ) : (
              <PdfViewer pdf={flowPoolNode?.params ?? ""} />
            );
          case "CSVOutput":
            return left ? (
              <>
                <div className="flex justify-between">
                  Expand the ouptut to see the CSV
                </div>
                <div className="flex items-center justify-between pt-5">
                  <span>CSV separator </span>
                  <Select
                    value={node.data.node.template.separator.value}
                    onValueChange={(e) => handleChangeSelect(e)}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {node?.data?.node?.template?.separator?.options.map(
                          (separator) => (
                            <SelectItem key={separator} value={separator}>
                              {separator}
                            </SelectItem>
                          )
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <CsvOutputComponent csvNode={node} flowPool={flowPoolNode} />
              </>
            );
          case "ImageOutput":
            return left ? (
              <div>Expand the view to see the image</div>
            ) : (
              <ImageViewer
                image={
                  (flowPool[node.id] ?? [])[
                    (flowPool[node.id]?.length ?? 1) - 1
                  ]?.params ?? ""
                }
              />
            );

          default:
            return (
              <Textarea
                className={`w-full custom-scroll ${
                  left ? " min-h-32" : " h-full"
                }`}
                placeholder={"Empty"}
                // update to real value on flowPool
                value={
                  (flowPool[node.id] ?? [])[
                    (flowPool[node.id]?.length ?? 1) - 1
                  ]?.params ?? ""
                }
                readOnly
              />
            );
        }
      default:
        break;
    }
  }
  return handleOutputType();
}
