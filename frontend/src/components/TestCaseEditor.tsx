import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@consta/uikit/Button';
import { TextField } from '@consta/uikit/TextField';
import { TextArea } from '@consta/uikit/TextArea';
import { Select } from '@consta/uikit/Select';
import { Badge } from '@consta/uikit/Badge';
import { Text } from '@consta/uikit/Text';
import { IconPlus, IconTrash, IconCopy, IconSave, IconUndo } from '@consta/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useMutation, useQueryClient } from 'react-query';
import { updateTestCase, deleteTestCase, cloneTestCase, TestCase, TestStep, Label } from '../services/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TestCaseEditorProps {
  testCase: TestCase;
  onUpdate: (testCase: TestCase) => void;
  onDelete: () => void;
  onClone: (testCase: TestCase) => void;
}

const TestCaseEditor: React.FC<TestCaseEditorProps> = ({
  testCase,
  onUpdate,
  onDelete,
  onClone
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: testCase.title,
      author: testCase.author,
      description: testCase.description || '',
      precondition: testCase.precondition || '',
      status: testCase.status,
      tags: testCase.tags,
      steps: testCase.steps,
      labels: testCase.labels
    }
  });

  const { fields: stepFields, append: appendStep, remove: removeStep, move: moveStep } = useFieldArray({
    control,
    name: 'steps'
  });

  const { fields: labelFields, append: appendLabel, remove: removeLabel } = useFieldArray({
    control,
    name: 'labels'
  });

  const updateMutation = useMutation(updateTestCase, {
    onSuccess: (updatedTestCase) => {
      onUpdate(updatedTestCase);
      setIsEditing(false);
      queryClient.invalidateQueries('test-cases');
    },
  });

  const deleteMutation = useMutation(deleteTestCase, {
    onSuccess: () => {
      onDelete();
      queryClient.invalidateQueries('test-cases');
    },
  });

  const cloneMutation = useMutation(cloneTestCase, {
    onSuccess: (clonedTestCase) => {
      onClone(clonedTestCase);
      queryClient.invalidateQueries('test-cases');
    },
  });

  const statusOptions = [
    { label: 'Черновик', value: 'draft' },
    { label: 'Дизайн', value: 'design' },
    { label: 'Готово', value: 'done' },
  ];

  const onSubmit = (data: any) => {
    updateMutation.mutate({ id: testCase.id, ...data });
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить этот тест-кейс?')) {
      deleteMutation.mutate(testCase.id);
    }
  };

  const handleClone = () => {
    cloneMutation.mutate(testCase.id);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    moveStep(result.source.index, result.destination.index);
  };

  const addTag = () => {
    const tag = prompt('Введите тег:');
    if (tag) {
      const currentTags = watch('tags') || [];
      setValue('tags', [...currentTags, tag]);
    }
  };

  const removeTag = (index: number) => {
    const currentTags = watch('tags') || [];
    setValue('tags', currentTags.filter((_, i) => i !== index));
  };

  const addLabel = () => {
    const name = prompt('Введите название лейбла:');
    const value = prompt('Введите значение лейбла:');
    if (name && value) {
      appendLabel({ name, value });
    }
  };

  return (
    <div className="test-case-editor">
      <div className="test-case-header">
        <div>
          <h1 className="test-case-title">{testCase.title}</h1>
          <div className="test-case-meta">
            <span>ID: {testCase.id}</span>
            <span>Автор: {testCase.author}</span>
            <span>Статус: {statusOptions.find(s => s.value === testCase.status)?.label}</span>
            <span>
              Создан: {format(new Date(testCase.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
            </span>
            {testCase.updated_at && (
              <span>
                Обновлен: {format(new Date(testCase.updated_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
              </span>
            )}
          </div>
        </div>
        
        <div className="test-case-actions">
          {!isEditing ? (
            <>
              <Button
                size="s"
                view="primary"
                iconLeft={IconSave}
                onClick={() => setIsEditing(true)}
              >
                Редактировать
              </Button>
              <Button
                size="s"
                view="secondary"
                iconLeft={IconCopy}
                onClick={handleClone}
              >
                Клонировать
              </Button>
              <Button
                size="s"
                view="ghost"
                iconLeft={IconTrash}
                onClick={handleDelete}
              >
                Удалить
              </Button>
            </>
          ) : (
            <>
              <Button
                size="s"
                view="primary"
                iconLeft={IconSave}
                onClick={handleSubmit(onSubmit)}
                loading={updateMutation.isLoading}
              >
                Сохранить
              </Button>
              <Button
                size="s"
                view="ghost"
                iconLeft={IconUndo}
                onClick={() => setIsEditing(false)}
              >
                Отмена
              </Button>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-section">
          <h3 className="form-section-title">Основная информация</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <TextField
              label="Название"
              {...register('title', { required: 'Название обязательно' })}
              disabled={!isEditing}
              size="s"
            />
            <TextField
              label="Автор"
              {...register('author', { required: 'Автор обязателен' })}
              disabled={!isEditing}
              size="s"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <Select
              label="Статус"
              items={statusOptions}
              value={statusOptions.find(s => s.value === watch('status'))}
              onChange={({ value }) => setValue('status', value?.value || 'draft')}
              disabled={!isEditing}
              size="s"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <TextArea
              label="Описание"
              {...register('description')}
              disabled={!isEditing}
              size="s"
              rows={3}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <TextArea
              label="Предусловия"
              {...register('precondition')}
              disabled={!isEditing}
              size="s"
              rows={2}
            />
          </div>
        </div>

        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 className="form-section-title">Теги</h3>
            {isEditing && (
              <Button
                size="xs"
                view="ghost"
                iconLeft={IconPlus}
                onClick={addTag}
              >
                Добавить тег
              </Button>
            )}
          </div>
          
          <div className="tags-container">
            {watch('tags')?.map((tag: string, index: number) => (
              <Badge
                key={index}
                label={tag}
                status="normal"
                size="s"
                onCancel={isEditing ? () => removeTag(index) : undefined}
              />
            ))}
          </div>
        </div>

        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 className="form-section-title">Лейблы</h3>
            {isEditing && (
              <Button
                size="xs"
                view="ghost"
                iconLeft={IconPlus}
                onClick={addLabel}
              >
                Добавить лейбл
              </Button>
            )}
          </div>
          
          <div className="labels-container">
            {labelFields.map((label, index) => (
              <div key={label.id} className="label-item">
                <Text size="xs">
                  {label.name}: {label.value}
                </Text>
                {isEditing && (
                  <Button
                    size="xs"
                    view="ghost"
                    iconLeft={IconTrash}
                    onClick={() => removeLabel(index)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 className="form-section-title">Шаги тестирования</h3>
            {isEditing && (
              <Button
                size="xs"
                view="ghost"
                iconLeft={IconPlus}
                onClick={() => appendStep({ step: '', expected_res: '' })}
              >
                Добавить шаг
              </Button>
            )}
          </div>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="steps">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="steps-list">
                  {stepFields.map((step, index) => (
                    <Draggable key={step.id} draggableId={step.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="step-item"
                          style={{
                            backgroundColor: snapshot.isDragging ? '#f0f2f5' : '#fafafa',
                            ...provided.draggableProps.style
                          }}
                        >
                          <div className="step-header">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {isEditing && (
                                <div
                                  {...provided.dragHandleProps}
                                  className="drag-handle"
                                >
                                  ⋮⋮
                                </div>
                              )}
                              <div className="step-number">{index + 1}</div>
                            </div>
                            
                            {isEditing && (
                              <div className="step-actions">
                                <Button
                                  size="xs"
                                  view="ghost"
                                  iconLeft={IconTrash}
                                  onClick={() => removeStep(index)}
                                />
                              </div>
                            )}
                          </div>
                          
                          <div style={{ marginBottom: '12px' }}>
                            <TextArea
                              label="Шаг"
                              {...register(`steps.${index}.step`)}
                              disabled={!isEditing}
                              size="s"
                              rows={2}
                            />
                          </div>
                          
                          <div>
                            <TextArea
                              label="Ожидаемый результат"
                              {...register(`steps.${index}.expected_res`)}
                              disabled={!isEditing}
                              size="s"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </form>
    </div>
  );
};

export default TestCaseEditor;
