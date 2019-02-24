
obj = foo: 'bar'

describe 'coffeescript', ->
  it 'should work (coffee)', ->
    expect(obj, 'to equal', foo: 'bar')
