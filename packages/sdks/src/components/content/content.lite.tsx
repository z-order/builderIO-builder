import {
  Show,
  setContext,
  useMetadata,
  useState,
  useStore,
  useTarget,
} from '@builder.io/mitosis';
import { getDefaultRegisteredComponents } from '../../constants/builder-registered-components.js';
import { TARGET } from '../../constants/target.js';
import ComponentsContext from '../../context/components.context.lite.js';
import type {
  BuilderContextInterface,
  BuilderRenderState,
  RegisteredComponents,
} from '../../context/types.js';
import {
  components,
  serializeComponentInfo,
} from '../../functions/register-component.js';
import type { ComponentInfo } from '../../types/components.js';
import type { Dictionary } from '../../types/typescript.js';
import Blocks from '../blocks/blocks.lite.jsx';
import { getUpdateVariantVisibilityScript } from '../content-variants/helpers.js';
import InlinedScript from '../inlined-script.lite.jsx';
import EnableEditor from './components/enable-editor.lite.jsx';
import ContentStyles from './components/styles.lite.jsx';
import {
  getContentInitialValue,
  getRootStateInitialValue,
} from './content.helpers.js';
import type { ContentProps } from './content.types.js';
import { wrapComponentRef } from './wrap-component-ref.js';

useMetadata({
  qwik: {
    hasDeepStore: true,
  },
  rsc: {
    componentType: 'server',
  },
});

export default function ContentComponent(props: ContentProps) {
  const state = useStore({
    scriptStr: getUpdateVariantVisibilityScript({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
      variationId: props.content?.testVariationId!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
      contentId: props.content?.id!,
    }),
    contentSetState: (newRootState: BuilderRenderState) => {
      builderContextSignal.value.rootState = newRootState;
    },

    registeredComponents: [
      ...getDefaultRegisteredComponents(),
      // While this `components` object is deprecated, we must maintain support for it.
      // Since users are able to override our default components, we need to make sure that we do not break such
      // existing usage.
      // This is why we spread `components` after the default Builder.io components, but before the `props.customComponents`,
      // which is the new standard way of providing custom components, and must therefore take precedence.
      ...components,
      ...(props.customComponents || []),
    ].reduce<RegisteredComponents>(
      (acc, { component, ...info }) => ({
        ...acc,
        [info.name]: {
          component: useTarget({
            vue: wrapComponentRef(component),
            default: component,
          }),
          ...serializeComponentInfo(info),
        },
      }),
      {}
    ),
  });

  const [builderContextSignal, setBuilderContextSignal] =
    useState<BuilderContextInterface>(
      {
        content: getContentInitialValue({
          content: useTarget({
            /**
             * Temporary workaround until https://github.com/BuilderIO/qwik/pull/5013 is merged.
             */
            qwik: JSON.parse(JSON.stringify(props.content || {})),
            default: props.content,
          }),
          data: props.data,
        }),
        localState: undefined,
        rootState: getRootStateInitialValue({
          content: props.content,
          data: props.data,
          locale: props.locale,
        }),
        rootSetState: useTarget({
          qwik: undefined,
          rsc: undefined,
          default: state.contentSetState,
        }),
        context: props.context || {},
        apiKey: props.apiKey,
        apiVersion: props.apiVersion,
        componentInfos: [
          ...getDefaultRegisteredComponents(),
          // While this `components` object is deprecated, we must maintain support for it.
          // Since users are able to override our default components, we need to make sure that we do not break such
          // existing usage.
          // This is why we spread `components` after the default Builder.io components, but before the `props.customComponents`,
          // which is the new standard way of providing custom components, and must therefore take precedence.
          ...components,
          ...(props.customComponents || []),
        ].reduce<Dictionary<ComponentInfo>>(
          (acc, { component: _, ...info }) => ({
            ...acc,
            [info.name]: serializeComponentInfo(info),
          }),
          {}
        ),
        inheritedStyles: {},
        BlocksWrapper: useTarget({
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          reactNative: props.blocksWrapper || ScrollView,
          default: props.blocksWrapper || 'div',
        }),
        BlocksWrapperProps: props.blocksWrapperProps || {},
      },
      { reactive: true }
    );

  setContext(ComponentsContext, {
    registeredComponents: state.registeredComponents,
  });

  return (
    <EnableEditor
      content={props.content}
      data={props.data}
      model={props.model}
      context={props.context}
      apiKey={props.apiKey}
      canTrack={props.canTrack}
      locale={props.locale}
      includeRefs={props.includeRefs}
      enrich={props.enrich}
      showContent={props.showContent}
      builderContextSignal={builderContextSignal}
      contentWrapper={props.contentWrapper}
      contentWrapperProps={props.contentWrapperProps}
      trustedHosts={props.trustedHosts}
      {...useTarget({
        // eslint-disable-next-line object-shorthand
        react: { setBuilderContextSignal: setBuilderContextSignal },
        // eslint-disable-next-line object-shorthand
        reactNative: { setBuilderContextSignal: setBuilderContextSignal },
        // eslint-disable-next-line object-shorthand
        solid: { setBuilderContextSignal: setBuilderContextSignal },
        default: {},
      })}
    >
      <Show when={props.isSsrAbTest}>
        <InlinedScript scriptStr={state.scriptStr} />
      </Show>
      <Show when={TARGET !== 'reactNative'}>
        <ContentStyles
          contentId={builderContextSignal.value.content?.id}
          cssCode={builderContextSignal.value.content?.data?.cssCode}
          customFonts={builderContextSignal.value.content?.data?.customFonts}
        />
      </Show>
      <Blocks
        blocks={builderContextSignal.value.content?.data?.blocks}
        context={builderContextSignal}
        registeredComponents={state.registeredComponents}
      />
    </EnableEditor>
  );
}
