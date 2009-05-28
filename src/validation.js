Form.Validation = {};

(function() {
  
  function validators(element){
    element._validators = element._validators || [];
    return element._validators;
  }
  
  function formFor(element){
    return element.nodeName == 'FORM' ? element : element.form;
  }
  
  function memoFor(element){
    var memo = {};
    memo.element = memo['element'] = element;
    memo.form = memo['form'] = formFor(element);
    return memo;
  }

  /* Add validation handlers to a Form or FormElement
   */
  function validates(element, method){
    if (Object.isString(method)){
      if (element == formFor(element)){
        method = Form.Validators[method];
      }else{
        method = Form.ElementValidators[method];
      }
    }

    if (!Object.isFunction(method))
      throw new Error('validator must be a function');
    element.validators().push( method.curry(element, formFor(element)) );
    return element;
  }
  
  function isValid(element){
    element.validate();
    return !element.validationErrors().size();
  }
  
  function setValidAttribute(element, value){
    element.setAttribute('valid',value);
    var labelElement = element.labelElement();
    if (labelElement) labelElement.setAttribute('valid',value);
    return element;
  };

  function setValid(element){
    return setValidAttribute(element, 'true');
  }
  
  function setInvalid(element){
    return setValidAttribute(element, 'false');
  }

  // Form Element Methods
  Object.extend(Form.Element.Methods,{
    validates: validates,
    validators: validators,
    validationErrors: function(element){
      return element.form.validationErrors().forElement(element);
    },
    validate: function(element){
      element.fire('form:element:validation',memoFor(element));
      element.resetValidation();
      if (!element.validators().length) return true;
      element.validators().each(function(validator){ return validator(); });
      return element.setValidationState();
    },
    isValid:isValid,
    setValidationState: function(element){
      element.resetValidationState();
      if (element.validationErrors().size()){
        element.setInvalid();
        element.fire('form:element:validation:success',memoFor(element));
      }else{
        element.setValid();
        element.fire('form:element:validation:failure',memoFor(element));
      }
      return element;
    },
    setValid: setValid,
    setInvalid: setInvalid,
    resetValidationState: function(element){
      setValidAttribute(element, '');
      return element;
    },
    resetValidation: function(element){
      element.form.validationErrors().clear(element);
      element.resetValidationState
      return element;
    },
    
    labelElement: function(element){
      return element.up('label') || $$('label[for="'+element.id+'"]').first();
    },
    label: function(element){
      var labelElement = element.labelElement();
      if (labelElement){
        return $A(labelElement.childNodes).inject('',function(textLabel, node){ 
          if (node.nodeName == '#text'){
            var textContent = node.data.strip();
            if (textContent != '') return textContent;
          }
          return textLabel;
        });
      }
    }
  });
  
  // Form Methods
  Object.extend(Form.Methods,{
    validates: validates,
    validators: validators,
    validationErrors: function(form){
      form._errors = form._errors || new Form.Validation.Errors(form);
      return form._errors;
    },
    validate: function(form){
      form.resetValidation();
      var formElementValidators = form.getElements().map(function(element){ return element.isValid(); });
      var formValidators = form.validators().map(function(validator){ return validator(); });
      
      // if ( formElementValidators.all() && formValidators.all() )  {

      return form.setValidationState();
    },
    isValid:isValid,
    setValidationState: function(form){
      form.resetValidationState();
      form.getElements().each(function(element){ element.setValidationState(); });
      if (form.validationErrors().size()){
        form.setInvalid();
        form.fire('form:validation:success',memoFor(form));
      }else{
        form.setValid();
        form.fire('form:validation:failure',memoFor(form));
      }
      return form;
    },
    setValid: setValid,
    setInvalid: setInvalid,
    resetValidationState: function(form){
      form.setAttribute('valid','');
      form.getElements().invoke('resetValidationState');
      return form;
    },
    resetValidation: function(form){
      form.validationErrors().clear();
      form.setAttribute('valid','');
      form.getElements().invoke('resetValidation');
      return form;
    },
    
    label: function(form){ return form.getAttribute('name') || form.id || 'Form'; },
    labelElement: Prototype.emptyFunction,

    
    validatesOnSubmit: function(form){
      form.observe('submit',function(event){
        if (!form.isValid()) {
          event.stop();
          form.fire('form:validation:submit:failure', memoFor(form));
        }
      });
      return this;
    },
    
    elementsValidateOnChange: function(form){
      form.getElements().each(function(input){
        input.observe('change',function(){ input.isValid(); });
      });
      return this;
    },
    
    elementsValidateOnBlur: function(form){
      form.getElements().each(function(input){
        input.observe('blur',function(){ input.isValid(); });
      });
      return this;
    },
    
    elementsValidateOnBlur: function(form){
      form.getElements().each(function(input){
        input.observe('blur',function(){ input.isValid(); });
      });
      return this;
    }
    
  });
  
  Element.addMethods();
})();



Form.Validation.Errors = Class.create(Enumerable,{
  initialize: function(form){
    this.form = form = $(form);
    this.errors = [];
  },
  toObject: function(){ return $A(this.errors); },
  toArray:  function(){ return $A(this.errors); },
  _each: function(iterator) {
    this.errors._each(iterator);
    return this;
  },
  clear: function(element){
    if (!this.errors.size()) return this;
    
    if (!element){
      this.errors.clear();
    }else{
      this.errors = this.errors.findAll(function(error){ 
        var errorElement = this.form[error[0]];
        return (errorElement != element); 
      }.bind(this));
    }
    
    return this;
  },
  empty: function(){ return (this.errors.length == 0); },
  add: function(inputName,errorMessage){
    var inputName = Object.isElement(inputName) ? inputName.getAttribute('name') : inputName;
    this.errors.push([inputName,errorMessage]);
    return this;
  },
  forElement: function(element){
    var elements = $A(arguments);
    return this.errors
             .findAll(function(error){ 
                var element = this.form[error[0]];
                return elements.include(element);
              }.bind(this));
  },
  fullMessages: function(){
    return this.errors.map(function(error){
      var elementName = error.element.label() || error.element.id || error.inputName;
      return elementName+' '+error[1];
    });
  }
});

Form.Validators = {
  
};

Form.ElementValidators = {
  isblank: function(input){
    if (input.value.blank()) return true;
    input.form.validationErrors().add(input,'must be blank');
  },
  notBlank: function(input){
    if (!input.value.blank()) return true;
    input.form.validationErrors().add(input,'cannot be blank');
  },
  
  isChecked: function(checkbox){
    if (checkbox.checked) return true;
    checkbox.form.validationErrors().add(checkbox,'must be checked');
  },
  isNotChecked: function(checkbox){
    if (!checkbox.checked) return true;
    checkbox.form.validationErrors().add(checkbox,'cannot be checked');
  },
  
  isEmailAddress: function(input){
    if (!!input.value.match(/^.+@.+\.\w\w+$/)) return true;
    input.form.validationErrors().add(input,'invalid address');
  }
};
