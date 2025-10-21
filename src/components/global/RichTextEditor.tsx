import React, { JSX } from 'react';
import parse from 'html-react-parser';

export interface RichTextNode {
  type: string;
  level?: number;
  format?: string;
  url?: string;
  children?: RichTextNode[];
  [key: string]: unknown;
}

const renderNode = (node: RichTextNode | null | undefined, index: number): React.ReactNode => {
  if (!node) return null;

  switch (node.type) {
    case 'heading': {
      const HeadingTag = `h${node.level}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag
          key={index}
          className={`text-heading${node.level} font-semibold mt-6 mb-2`}
        >
          {node.children?.map((child: RichTextNode, i: number) => renderNode(child, i))}
        </HeadingTag>
      );
    }

    case 'paragraph':
      return (
        <p
          key={index}
          className="text-base md:text-lg text-[#212529b3] leading-relaxed mb-4"
        >
          {node.children?.map((child: RichTextNode, i: number) => renderNode(child, i))}
        </p>
      );

    case 'list': {
      const ListTag = node.format === 'ordered' ? 'ol' : 'ul';
      return (
        <ListTag
          key={index}
          className={`pl-5 mb-4 ${
            node.format === 'ordered' ? 'list-decimal' : 'list-disc'
          }`}
        >
          {node.children?.map((item: RichTextNode, i: number) => renderNode(item, i))}
        </ListTag>
      );
    }

    case 'list-item':
      return (
        <li key={index}>
          {node.children?.map((child: RichTextNode, i: number) => renderNode(child, i))}
        </li>
      );

    case 'link':
      return (
        <a
          key={index}
          href={node.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {node.children?.map((child: RichTextNode, i: number) => renderNode(child, i))}
        </a>
      );

    case 'text': {
      let text: React.ReactNode;
      if (node.code){
        text = (
          <span
            key={index}
            className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono"
          >
            {node.text as React.ReactNode}
          </span>
        )}
      text = parse(String(node.text ?? ''))
      if (node.bold) text = <strong key={index}>{text}</strong>;
      if (node.italic) text = <em key={index}>{text}</em>;
      if (node.underline) text = <u key={index}>{text}</u>;
      if (node.strikethrough) text = <s key={index}>{text}</s>;

      return <span key={index}>{text}</span>;
    }

    default:
      return null;
  }
};

interface RichTextRendererProps {
  content: RichTextNode[];
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content }) => {
  return <div className='mx-32 my-10'>{content?.map((node, index) => renderNode(node, index))}</div>;
};

export default RichTextRenderer;
