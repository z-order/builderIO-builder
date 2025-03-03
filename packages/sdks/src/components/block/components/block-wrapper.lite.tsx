import type { Signal } from '@builder.io/mitosis';
import { useMetadata } from '@builder.io/mitosis';
import type { BuilderContextInterface } from '../../../context/types.js';
import { getBlockActions } from '../../../functions/get-block-actions.js';
import { getBlockProperties } from '../../../functions/get-block-properties.js';
import type { BuilderBlock } from '../../../types/builder-block.js';
import type { PropsWithChildren } from '../../../types/typescript.js';
import DynamicRenderer from '../../dynamic-renderer/dynamic-renderer.lite.jsx';

useMetadata({
  elementTag: 'props.Wrapper',
  options: {
    vue3: {
      asyncComponentImports: true,
    },
  },
  rsc: {
    componentType: 'client',
  },
});

type BlockWrapperProps = {
  Wrapper: string;
  block: BuilderBlock;
  context: Signal<BuilderContextInterface>;
};

/**
 * This component renders a block's wrapper HTML element (from the block's `tagName` property).
 */
export default function BlockWrapper(
  props: PropsWithChildren<BlockWrapperProps>
) {
  return (
    <DynamicRenderer
      TagName={props.Wrapper}
      attributes={getBlockProperties({
        block: props.block,
        context: props.context.value,
      })}
      actionAttributes={getBlockActions({
        block: props.block,
        rootState: props.context.value.rootState,
        rootSetState: props.context.value.rootSetState,
        localState: props.context.value.localState,
        context: props.context.value.context,
        stripPrefix: true,
      })}
    >
      {props.children}
    </DynamicRenderer>
  );
}
