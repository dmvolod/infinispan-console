import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  ActionGroup,
  Button,
  Card,
  CardBody,
  ExpandableSection,
  Form,
  FormGroup,
  PageSection,
  PageSectionVariants,
  Select,
  SelectOption,
  SelectVariant,
  Text,
  TextArea,
  TextContent,
  TextInput,
  TextVariants,
  Toolbar,
  ToolbarContent,
} from '@patternfly/react-core';
import { CubeIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import cacheService from '@services/cacheService';
import dataContainerService from '@services/dataContainerService';
import displayUtils from '@services/displayUtils';
import { useHistory } from 'react-router';
import { useApiAlert } from '@app/utils/useApiAlert';
import { DataContainerBreadcrumb } from '@app/Common/DataContainerBreadcrumb';

const CreateCache: React.FunctionComponent<any> = (props) => {
  const { addAlert } = useApiAlert();
  const history = useHistory();
  const cmName = props.computedMatch.params.cmName;
  const [cacheName, setCacheName] = useState('');
  const [validName, setValidName] = useState<'success' | 'error' | 'default'>(
    'default'
  );
  const [config, setConfig] = useState('');
  const [configs, setConfigs] = useState<OptionSelect[]>([]);
  const [expandedSelect, setExpandedSelect] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [selectedConfigDisabled, setSelectedConfigDisabled] = useState(false);
  const [configExpanded, setConfigExpanded] = useState(false);
  const [validConfig, setValidConfig] = useState<
    'success' | 'error' | 'default'
  >('default');

  interface OptionSelect {
    value: string;
    disabled?: boolean;
    isPlaceholder?: boolean;
  }

  useEffect(() => {
    dataContainerService
      .getCacheConfigurationTemplates(cmName)
      .then((eitherTemplates) => {
        if (eitherTemplates.isRight()) {
          let options: OptionSelect[] = [];
          eitherTemplates.value.forEach((template) => {
            options.push({ value: template.name });
          });
          setConfigs(options);
        } else {
          addAlert(eitherTemplates.value);
        }
      });
  }, []);

  const onToggleConfigPanel = () => {
    const expanded = !configExpanded;
    setConfigExpanded(expanded);
    setSelectedConfigDisabled(expanded);
    setSelectedConfig('');
  };

  const handleChangeName = (name) => {
    setCacheName(name);
  };

  const handleChangeConfig = (config) => {
    setConfig(config);
    setValidConfig('success');
  };

  const onToggle = (isExpanded) => {
    setExpandedSelect(isExpanded);
  };

  const clearSelection = () => {
    setSelectedConfig('');
    setExpandedSelect(false);
  };

  const onSelect = (event, selection, isPlaceholder) => {
    if (isPlaceholder) clearSelection();
    else {
      setSelectedConfig(selection);
      setExpandedSelect(false);
    }
  };

  const validateConfig = (): boolean => {
    const trimmedConf = config.trim();
    if (trimmedConf.length == 0) {
      return false;
    }
    let isJson = false;
    let isXML = false;
    try {
      JSON.parse(trimmedConf);
      isJson = true;
    } catch (ex) {}

    try {
      let oDOM = new DOMParser().parseFromString(trimmedConf, 'text/xml');
      if (oDOM.getElementsByTagName('parsererror').length == 0) {
        isXML = true;
      }
    } catch (ex) {}
    return isJson || isXML;
  };

  const createCache = () => {
    const name = cacheName.trim();
    let isValidName: 'success' | 'error' =
      name.length > 0 ? 'success' : 'error';
    let isValidConfig: 'success' | 'error' =
      selectedConfig != '' || validateConfig() ? 'success' : 'error';
    setValidName(isValidName);
    setValidConfig(isValidConfig);

    if (isValidName == 'error' || isValidConfig == 'error') {
      return;
    }
    let createCacheCall: Promise<ActionResponse>;
    if (selectedConfig != '') {
      createCacheCall = cacheService.createCacheByConfigName(
        name,
        selectedConfig
      );
    } else {
      createCacheCall = cacheService.createCacheWithConfiguration(name, config);
    }
    createCacheCall
      .then((actionResponse) => {
        if (actionResponse.success) {
          history.push('/');
        }
        return actionResponse;
      })
      .then((actionResponse) => addAlert(actionResponse));
  };

  const titleId = 'plain-typeahead-select-id';
  let title = 'Data container is empty';
  if (cmName !== undefined) {
    title = displayUtils.capitalize(cmName);
  }
  return (
    <React.Fragment>
      <PageSection variant={PageSectionVariants.light}>
        <DataContainerBreadcrumb currentPage="Create cache" />
        <Toolbar id="create-cache-header">
          <ToolbarContent style={{ paddingLeft: 0 }}>
            <TextContent>
              <Text component={TextVariants.h1}>Create a cache in {title}</Text>
            </TextContent>
          </ToolbarContent>
        </Toolbar>
      </PageSection>
      <PageSection>
        <Card>
          <CardBody>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <FormGroup
                label="Name"
                isRequired
                fieldId="cache-name"
                helperText="Please provide a cache name"
                validated={validName}
                helperTextInvalid="Cache name is mandatory"
              >
                <TextInput
                  isRequired
                  type="text"
                  id="cache-name"
                  name="cache-name"
                  aria-describedby="cache-name-helper"
                  value={cacheName}
                  onChange={handleChangeName}
                  validated={validName}
                />
              </FormGroup>
              <FormGroup
                fieldId="cache-config-name"
                label="Template"
                helperText="Please choose a template or provide a new configuration"
                validated={validConfig}
                helperTextInvalid="Either choose a template or provide a configuration"
              >
                <Select
                  toggleIcon={<CubeIcon />}
                  variant={SelectVariant.typeahead}
                  aria-label="Configuration templates"
                  onToggle={onToggle}
                  onSelect={onSelect}
                  // @ts-ignore
                  selections={selectedConfig}
                  isOpen={expandedSelect}
                  isDisabled={selectedConfigDisabled}
                  aria-labelledby={titleId}
                  placeholderText="Choose a template"
                  onClear={clearSelection}
                >
                  {configs.map((option, index) => (
                    <SelectOption
                      isDisabled={option.disabled}
                      key={index}
                      value={option.value}
                      isPlaceholder={option.isPlaceholder}
                    />
                  ))}
                </Select>
              </FormGroup>
              <ExpandableSection
                toggleText="Provide a configuration"
                isExpanded={configExpanded}
                onToggle={onToggleConfigPanel}
              >
                <FormGroup
                  label="Config"
                  fieldId="cache-config"
                  helperText="Please provide a cache config JSON or XML"
                  helperTextInvalid="Either choose a template or provide a configuration"
                >
                  <TextArea
                    isRequired
                    value={config}
                    onChange={handleChangeConfig}
                    name="cache-config"
                    id="cache-config"
                    validated={validConfig}
                    rows={10}
                  />
                </FormGroup>
              </ExpandableSection>

              <ActionGroup>
                <Button variant="primary" onClick={createCache}>
                  Create
                </Button>
                <Link to="/">
                  <Button variant="secondary" target="_blank">
                    Back
                  </Button>
                </Link>
              </ActionGroup>
            </Form>
          </CardBody>
        </Card>
      </PageSection>
    </React.Fragment>
  );
};
export { CreateCache };
